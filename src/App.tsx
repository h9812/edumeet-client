import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { startListeners, stopListeners } from './store/actions/startActions';
import {
	useAppDispatch,
	useAppSelector,
	useNotifier
} from './store/hooks';
import StyledBackground from './components/StyledBackground';
import Join from './views/join/Join';
import Lobby from './views/lobby/Lobby';
import Room from './views/room/Room';
import { sendFiles } from './store/actions/filesharingActions';
import { uiActions } from './store/slices/uiSlice';
import { roomActions, RoomConnectionState } from './store/slices/roomSlice';
import { LeavePrompt } from './components/leaveprompt/LeavePrompt';
import { meActions } from './store/slices/meSlice';
import { permissionsActions } from './store/slices/permissionsSlice';
import { settingsActions } from './store/slices/settingsSlice';
import edumeetConfig from './utils/edumeetConfig';
import { initFirebase, getFirebaseAuth } from './services/firebaseService';
import { signInWithCustomToken, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { Logger } from 'edumeet-common';

const logger = new Logger('App');

type AppParams = {
	id: string;
};

type AuthState = 'loading' | 'authenticated' | 'waiting-postmessage' | 'login-required';

const POST_MESSAGE_TIMEOUT = 5000;

const App = (): JSX.Element => {
	useNotifier();
	const dispatch = useAppDispatch();
	const roomState = useAppSelector((state) => state.room.state) as RoomConnectionState;
	const isLoggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const id = (useParams<AppParams>() as AppParams).id.toLowerCase();
	const [ authState, setAuthState ] = useState<AuthState>(
		edumeetConfig.firebase ? 'loading' : 'authenticated'
	);
	const authResolvedRef = useRef(false);
	const postMessageAuthRef = useRef(false);
	// Tracks current authToken for use inside async closures.
	// authToken is NOT reset by permissionsSlice on roomState='left', unlike isLoggedIn.
	const authToken = useAppSelector((state) => state.me.authToken);
	const authTokenRef = useRef(authToken);

	authTokenRef.current = authToken;

	const handleAuthSuccess = useCallback((idToken: string, displayName?: string) => {
		dispatch(meActions.setAuthToken(idToken));
		if (displayName) dispatch(settingsActions.setDisplayName(displayName));
		dispatch(permissionsActions.setLoggedIn(true));
		authResolvedRef.current = true;
		setAuthState('authenticated');
	}, [ dispatch ]);

	useEffect(() => {
		if (!edumeetConfig.firebase) return;

		const auth = initFirebase(edumeetConfig.firebase);

		let unsubscribe: (() => void) | undefined;

		const initAuth = async () => {
			logger.debug('initAuth: start [hasOpener: %s]', Boolean(window.opener));
			await setPersistence(auth, browserSessionPersistence);
			logger.debug('initAuth: setPersistence done [authResolved: %s, postMsgAuth: %s, isLoggedIn: %s]',
				authResolvedRef.current, postMessageAuthRef.current, isLoggedIn
			);

			const hash = new URLSearchParams(window.location.hash.slice(1));
			const customToken = hash.get('customToken');
			const displayNameFromHash = hash.get('displayName');

			if (customToken) {
				logger.debug('initAuth: found customToken in URL hash, signing in... (Flow 2a)');
				try {
					const cred = await signInWithCustomToken(auth, customToken);
					const idToken = await cred.user.getIdToken();

					if (displayNameFromHash) {
						dispatch(settingsActions.setDisplayName(decodeURIComponent(displayNameFromHash)));
					}
					window.history.replaceState(null, '', window.location.pathname);
					handleAuthSuccess(idToken, cred.user.displayName || undefined);
				} catch (error) {
					logger.error('initAuth: signInWithCustomToken failed [error: %o]', error);
					setAuthState('login-required');
				}
			}

			logger.debug('initAuth: subscribing to onAuthStateChanged');
			unsubscribe = onAuthStateChanged(auth, async (user) => {
				logger.debug('onAuthStateChanged fired [user: %s, authResolved: %s, postMsgAuth: %s, authToken: %s]',
					user ? user.uid : 'null', authResolvedRef.current, postMessageAuthRef.current, Boolean(authTokenRef.current)
				);

				if (user) {
					if (!authResolvedRef.current) {
						logger.debug('onAuthStateChanged: existing Firebase session detected (Flow 2b) [uid: %s]', user.uid);
						const idToken = await user.getIdToken();

						handleAuthSuccess(idToken, user.displayName || undefined);
					} else {
						logger.debug('onAuthStateChanged: user exists but auth already resolved, skipping');
					}
				} else if (authResolvedRef.current) {
					if (postMessageAuthRef.current) {
						logger.debug('onAuthStateChanged: null but postMessage auth active — ignoring Firebase sign-out');

						return;
					}
					logger.debug('onAuthStateChanged: Firebase user signed out, resetting auth');
					authResolvedRef.current = false;
					dispatch(meActions.setAuthToken(undefined));
					dispatch(permissionsActions.setLoggedIn(false));
					dispatch(settingsActions.setDisplayName(''));
					setAuthState('login-required');
				} else if (customToken) {
					logger.debug('onAuthStateChanged: null after customToken flow, skipping');

					return;
				} else if (window.opener) {
					if (authTokenRef.current) {
						// Component remounted (e.g. after leave room) — authToken still in Redux
						// (permissionsSlice resets loggedIn on 'left' but meSlice keeps authToken).
						// Restore auth state without waiting for a new postMessage.
						logger.debug('onAuthStateChanged: null but authToken exists — remount case, restoring auth');
						postMessageAuthRef.current = true;
						authResolvedRef.current = true;
						dispatch(permissionsActions.setLoggedIn(true));
						setAuthState('authenticated');

						return;
					}
					logger.debug('onAuthStateChanged: no user, has opener — waiting for postMessage (Flow 1 Timeline B)');
					setAuthState('waiting-postmessage');

					const timeout = setTimeout(() => {
						logger.debug('postMessage timeout: no edumeet-login received within %dms → login-required', POST_MESSAGE_TIMEOUT);
						setAuthState('login-required');
					}, POST_MESSAGE_TIMEOUT);

					const handleMessage = ({ data, origin }: MessageEvent) => {
						if (edumeetConfig.baseFEOrigin && origin !== edumeetConfig.baseFEOrigin) return;
						if (data?.type !== 'edumeet-login') return;

						logger.debug('handleMessage: received edumeet-login from opener (Flow 1 Timeline B)');
						clearTimeout(timeout);

						const { token: receivedToken, displayName, picture } = data.data;

						if (receivedToken) {
							dispatch(meActions.setAuthToken(receivedToken));
						}
						if (displayName) dispatch(settingsActions.setDisplayName(displayName));
						if (picture) dispatch(meActions.setPicture(picture));
						dispatch(permissionsActions.setLoggedIn(true));
						postMessageAuthRef.current = true;
						authResolvedRef.current = true;
						setAuthState('authenticated');
						window.removeEventListener('message', handleMessage);
					};

					window.addEventListener('message', handleMessage);
				} else if (edumeetConfig.baseFELoginUrl) {
					logger.debug('onAuthStateChanged: no user, no opener, redirecting to base-fe login...');
					const returnTo = encodeURIComponent(window.location.href);

					window.location.href = `${edumeetConfig.baseFELoginUrl}?returnTo=${returnTo}`;
				} else {
					logger.debug('onAuthStateChanged: no user, no opener, no baseFELoginUrl — showing login UI');
					setAuthState('login-required');
				}
			});
		};

		initAuth();

		return () => unsubscribe?.();
	}, []);

	useEffect(() => {
		// startListeners can receive edumeet-login before App's local listener (Timeline A race).
		// If Redux auth is already set, mark as postMessage auth so onAuthStateChanged
		// window.opener branch doesn't re-enter waiting-postmessage later.
		if (isLoggedIn && authState !== 'authenticated') {
			logger.debug('isLoggedIn effect: isLoggedIn=true but authState=%s [authResolved: %s, postMsgAuth: %s, hasOpener: %s]',
				authState, authResolvedRef.current, postMessageAuthRef.current, Boolean(window.opener)
			);
			if (window.opener && edumeetConfig.firebase) {
				logger.debug('isLoggedIn effect: Flow 1 Timeline A detected — setting refs before onAuthStateChanged fires');
				postMessageAuthRef.current = true;
				authResolvedRef.current = true;
			}
			setAuthState('authenticated');
		}
	}, [ isLoggedIn, authState ]);

	const prevRoomStateRef = useRef<RoomConnectionState>('new');

	useEffect(() => {
		const wasInRoom = prevRoomStateRef.current === 'joined';

		prevRoomStateRef.current = roomState;

		if (wasInRoom && (roomState === 'new' || roomState === 'left') && edumeetConfig.firebase) {
			logger.debug('left meeting, re-authenticating before next join');

			if (postMessageAuthRef.current) {
				// Authenticated via postMessage — session is managed by base-fe opener.
				// Don't sign out Firebase or redirect; just let user re-join via Join screen.
				return;
			}

			const firebaseAuth = getFirebaseAuth();

			if (firebaseAuth) {
				firebaseAuth.signOut();
			}
			dispatch(meActions.setAuthToken(undefined));
			dispatch(permissionsActions.setLoggedIn(false));
			authResolvedRef.current = false;

			if (edumeetConfig.baseFELoginUrl) {
				const returnTo = encodeURIComponent(window.location.href);

				window.location.href = `${edumeetConfig.baseFELoginUrl}?returnTo=${returnTo}`;
			} else {
				setAuthState('login-required');
			}
		}
	}, [ roomState ]);

	useEffect(() => {
		dispatch(startListeners());

		return () => {
			dispatch(stopListeners());
			dispatch(roomActions.setState('new'));
		};
	}, []);

	useEffect(() => {
		if (authState !== 'login-required') return;
		if (!edumeetConfig.baseFELoginUrl) return;

		logger.debug('login-required: redirecting to base-fe login [url: %s]', edumeetConfig.baseFELoginUrl);
		const returnTo = encodeURIComponent(window.location.href);

		window.location.href = `${edumeetConfig.baseFELoginUrl}?returnTo=${returnTo}`;
	}, [ authState ]);

	const handleFileDrop = (event: React.DragEvent<HTMLDivElement>): void => {
		if (roomState !== 'joined') return;

		event.preventDefault();

		const droppedFiles = event.dataTransfer.files;

		if (droppedFiles?.length) {
			dispatch(uiActions.setUi({ filesharingOpen: true }));
			dispatch(sendFiles(droppedFiles));
		}
	};

	if (authState === 'loading' || authState === 'waiting-postmessage') {
		return (
			<StyledBackground>
				<></>
			</StyledBackground>
		);
	}

	return (
		<LeavePrompt>
			<StyledBackground
				onDrop={handleFileDrop}
				onDragOver={(event) => event.preventDefault()}
			>
				{
					roomState === 'joined' ?
						<Room /> : roomState === 'lobby' ?
							<Lobby /> : roomState === 'new' && <Join roomId={id} />
				}
			</StyledBackground>
		</LeavePrompt>
	);
};

export default App;