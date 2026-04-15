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
import FirebaseLogin from './views/firebaseLogin/FirebaseLogin';
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
			await setPersistence(auth, browserSessionPersistence);

			const hash = new URLSearchParams(window.location.hash.slice(1));
			const customToken = hash.get('customToken');
			const displayNameFromHash = hash.get('displayName');

			if (customToken) {
				logger.debug('found customToken in URL hash, signing in...');
				try {
					const cred = await signInWithCustomToken(auth, customToken);
					const idToken = await cred.user.getIdToken();

					if (displayNameFromHash) {
						dispatch(settingsActions.setDisplayName(decodeURIComponent(displayNameFromHash)));
					}
					window.history.replaceState(null, '', window.location.pathname);
					handleAuthSuccess(idToken, cred.user.displayName || undefined);
				} catch (error) {
					logger.error('signInWithCustomToken failed [error: %o]', error);
					setAuthState('login-required');
				}
			}

			unsubscribe = onAuthStateChanged(auth, async (user) => {
				if (user) {
					if (!authResolvedRef.current) {
						logger.debug('onAuthStateChanged: user exists [uid: %s]', user.uid);
						const idToken = await user.getIdToken();

						handleAuthSuccess(idToken, user.displayName || undefined);
					}
				} else if (authResolvedRef.current) {
					logger.debug('onAuthStateChanged: user signed out, resetting auth');
					authResolvedRef.current = false;
					dispatch(meActions.setAuthToken(undefined));
					dispatch(permissionsActions.setLoggedIn(false));
					dispatch(settingsActions.setDisplayName(''));
					setAuthState('login-required');
				} else if (customToken) {
					return;
				} else if (window.opener) {
					logger.debug('onAuthStateChanged: no user, has opener, waiting for postMessage...');
					setAuthState('waiting-postmessage');

					const timeout = setTimeout(() => {
						setAuthState('login-required');
					}, POST_MESSAGE_TIMEOUT);

					const handleMessage = ({ data, origin }: MessageEvent) => {
						if (edumeetConfig.baseFEOrigin && origin !== edumeetConfig.baseFEOrigin) return;
						if (data?.type !== 'edumeet-login') return;

						clearTimeout(timeout);

						const { token: authToken, displayName, picture } = data.data;

						if (authToken) {
							dispatch(meActions.setAuthToken(authToken));
						}
						if (displayName) dispatch(settingsActions.setDisplayName(displayName));
						if (picture) dispatch(meActions.setPicture(picture));
						dispatch(permissionsActions.setLoggedIn(true));
						setAuthState('authenticated');
						window.removeEventListener('message', handleMessage);
					};

					window.addEventListener('message', handleMessage);
				} else if (edumeetConfig.baseFELoginUrl) {
					logger.debug('onAuthStateChanged: no user, no opener, redirecting to base-fe login...');
					const returnTo = encodeURIComponent(window.location.href);

					window.location.href = `${edumeetConfig.baseFELoginUrl}?returnTo=${returnTo}`;
				} else {
					logger.debug('onAuthStateChanged: no user, showing login UI');
					setAuthState('login-required');
				}
			});
		};

		initAuth();

		return () => unsubscribe?.();
	}, []);

	useEffect(() => {
		// startListeners can receive edumeet-login before App's local listener.
		// If Redux auth is already set, unblock UI immediately.
		if (isLoggedIn && authState !== 'authenticated') {
			setAuthState('authenticated');
		}
	}, [ isLoggedIn, authState ]);

	const prevRoomStateRef = useRef<RoomConnectionState>('new');

	useEffect(() => {
		const wasInRoom = prevRoomStateRef.current === 'joined';

		prevRoomStateRef.current = roomState;

		if (wasInRoom && (roomState === 'new' || roomState === 'left') && edumeetConfig.firebase) {
			logger.debug('left meeting, re-authenticating before next join');
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

	if (authState === 'login-required' && edumeetConfig.firebase) {
		return (
			<StyledBackground>
				<FirebaseLogin onLoginSuccess={handleAuthSuccess} />
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