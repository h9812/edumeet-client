import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import {
	Block,
	Mic,
	Videocam,
	AccountCircle,
	MeetingRoom,
	Add,
} from '@mui/icons-material';
import TextInputField from '../../components/textinputfield/TextInputField';
import { signalingActions } from '../../store/slices/signalingSlice';
import { getSignalingUrl } from '../../utils/signalingHelpers';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	chooseMediaLabel,
	disableAllMediaLabel,
	enableAllMediaLabel,
	enableCameraLabel,
	enableMicrophoneLabel,
	joinLabel,
	yourNameLabel,
	roomNameLabel,
} from '../../components/translated/translatedComponents';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';
import { roomActions } from '../../store/slices/roomSlice';
import { settingsActions } from '../../store/slices/settingsSlice';

const ACTIVE_COLOR = '#518029';

type MediaMode = 'none' | 'mic' | 'cam' | 'both';

interface JoinProps {
	roomId: string;
}

const Join = ({ roomId }: JoinProps): JSX.Element => {
	const peerId = useAppSelector((state) => state.me.id);
	const dispatch = useAppDispatch();

	useAppSelector((state) => state.settings.locale);
	const stateDisplayName = useAppSelector((state) => state.settings.displayName);

	const [ localRoomId, setLocalRoomId ] = useState(roomId);
	const [ name, setName ] = useState(stateDisplayName || '');
	const [ joined, setJoined ] = useState(false);
	const [ mediaMode, setMediaMode ] = useState<MediaMode>('mic');
	const [ hasCamera, setHasCamera ] = useState(false);
	const [ hasMic, setHasMic ] = useState(false);

	useEffect(() => {
		navigator.mediaDevices.enumerateDevices()
			.then((devices) => {
				const camFound = devices.some((d) => d.kind === 'videoinput');
				const micFound = devices.some((d) => d.kind === 'audioinput');

				setHasCamera(camFound);
				setHasMic(micFound);

				// Adjust default mode based on available devices
				if (micFound) setMediaMode('mic');
				else if (camFound) setMediaMode('cam');
				else setMediaMode('none');
			})
			.catch(() => {
				// Cannot enumerate devices — leave defaults
			});
	}, []);

	const handleRoomIdChange = (value: string) => {
		const trimmed = value.trim();

		setLocalRoomId(trimmed || value);

		if (trimmed) {
			window.history.replaceState({}, '', `/${trimmed}`);
		}
	};

	const handleDisplayNameChange = (value: string) => {
		setName(value.trim() ? value : value.trim());
	};

	const handleJoin = () => {
		const encodedRoomId = encodeURIComponent(localRoomId);
		const url = getSignalingUrl(peerId, encodedRoomId);

		setJoined(true);

		dispatch(roomActions.updateRoom({ id: localRoomId }));
		dispatch(settingsActions.setDisplayName(name));
		dispatch(settingsActions.setAudioMuted(mediaMode === 'none' || mediaMode === 'cam'));
		dispatch(settingsActions.setVideoMuted(mediaMode === 'none' || mediaMode === 'mic'));
		dispatch(signalingActions.setUrl(url));
		dispatch(signalingActions.connect());
	};

	useEffect(() => {
		const dn = new URL(window.location.href).searchParams.get('displayName');

		if (dn) {
			dispatch(settingsActions.setDisplayName(dn));
			setName(dn);
		}
	}, []);

	useEffect(() => {
		const headless = new URL(window.location.href).searchParams.get('headless');

		if (headless) {
			const myNewURL = window.location.href.split('?')[0];

			window.history.pushState({}, '', myNewURL);
			handleJoin();
		}
	}, []);

	useEffect(() => {
		dispatch(roomActions.updateRoom({ id: roomId }));
	}, []);

	const mediaModes: {
		mode: MediaMode;
		icon: JSX.Element;
		tooltip: () => string;
		disabled: boolean;
	}[] = [
		{
			mode: 'none',
			icon: <Block />,
			tooltip: disableAllMediaLabel,
			disabled: false,
		},
		{
			mode: 'mic',
			icon: <Mic />,
			tooltip: enableMicrophoneLabel,
			disabled: !hasMic,
		},
		{
			mode: 'cam',
			icon: <Videocam />,
			tooltip: enableCameraLabel,
			disabled: !hasCamera,
		},
		{
			mode: 'both',
			icon: (
				<Stack direction='row' alignItems='center' spacing={0}>
					<Mic fontSize='small' />
					<Add sx={{ fontSize: 12 }} />
					<Videocam fontSize='small' />
				</Stack>
			),
			tooltip: enableAllMediaLabel,
			disabled: !hasMic || !hasCamera,
		},
	];

	return (
		<PrecallDialog
			content={
				<Stack spacing={2} mt={1}>
					<TextInputField
						label={roomNameLabel()}
						value={localRoomId}
						setValue={handleRoomIdChange}
						onEnter={handleJoin}
						startAdornment={<MeetingRoom />}
					/>
					<TextInputField
						label={yourNameLabel()}
						value={name}
						setValue={handleDisplayNameChange}
						onEnter={handleJoin}
						startAdornment={<AccountCircle />}
						autoFocus
						data-testid='name-input'
					/>
					<Typography variant='body2' color='text.secondary'>
						{ chooseMediaLabel() }
					</Typography>
					<Stack direction='row' alignItems='center' justifyContent='space-between'>
						<Box sx={{
							display: 'flex',
							border: 1,
							borderColor: 'divider',
							borderRadius: 1,
							overflow: 'hidden',
						}}>
							{ mediaModes.map(({ mode, icon, tooltip, disabled }, index) => {
								const isActive = mediaMode === mode;
								const isDisable = mode === 'none';
								const activeBg = isDisable ? 'error.main' : ACTIVE_COLOR;

								return (
									<Tooltip key={mode} title={tooltip()}>
										<Box
											component='button'
											onClick={() => !disabled && setMediaMode(mode)}
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												px: 1.25,
												py: 0.75,
												border: 0,
												borderLeft: index > 0 ? 1 : 0,
												borderColor: 'divider',
												cursor: disabled ? 'not-allowed' : 'pointer',
												opacity: disabled ? 0.35 : 1,
												bgcolor: isActive ? activeBg : 'transparent',
												color: isActive ? '#fff' : 'text.secondary',
												'&:hover': {
													bgcolor: disabled ? 'transparent' : isActive ? activeBg : 'action.hover',
												},
											}}
										>
											{ icon }
										</Box>
									</Tooltip>
								);
							}) }
						</Box>
						<Button
							onClick={handleJoin}
							variant='contained'
							disabled={!name || !localRoomId || joined}
							data-testid='join-button'
							sx={{
								bgcolor: ACTIVE_COLOR,
								'&:hover': { bgcolor: '#3e6120' },
								'&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
							}}
						>
							{ joinLabel() }
						</Button>
					</Stack>
				</Stack>
			}
		/>
	);
};

export default Join;
