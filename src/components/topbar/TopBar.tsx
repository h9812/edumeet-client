import {
	AppBar,
	Button,
	IconButton,
	Menu,
	MenuItem,
	Toolbar,
	Typography
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Fragment, useEffect, useState } from 'react';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import {
	fullscreenConsumerSelector,
	lobbyPeersLengthSelector,
	roomSessionCreationTimestampSelector,
	unreadSelector
} from '../../store/selectors';
import { drawerActions } from '../../store/slices/drawerSlice';
import MenuIcon from '@mui/icons-material/Menu';
import MoreIcon from '@mui/icons-material/MoreVert';
import RecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import edumeetConfig from '../../utils/edumeetConfig';
import { openDrawerLabel, startRecordingLabel, stopRecordingLabel } from '../translated/translatedComponents';
import { permissions } from '../../utils/roles';
import FloatingMenu from '../floatingmenu/FloatingMenu';
import Login from '../menuitems/Login';
import Lock from '../menuitems/Lock';
import Settings from '../menuitems/Settings';
import Participants from '../menuitems/Participants';
import Fullscreen from '../menuitems/Fullscreen';
import PulsingBadge from '../pulsingbadge/PulsingBadge';
import LobbyButton from '../controlbuttons/LobbyButton';
import LockButton from '../controlbuttons/LockButton';
import FullscreenButton from '../controlbuttons/FullscreenButton';
import ParticipantsButton from '../controlbuttons/ParticipantsButton';
import LoginButton from '../controlbuttons/LoginButton';
import SettingsButton from '../controlbuttons/SettingsButton';
import MicButton from '../controlbuttons/MicButton';
import WebcamButton from '../controlbuttons/WebcamButton';
import LeaveButton from '../textbuttons/LeaveButton';
import ScreenshareButton from '../controlbuttons/ScreenshareButton';
import ExtraVideo from '../menuitems/ExtraVideo';
import Filesharing from '../menuitems/Filesharing';
import TranscriptionMenuItem from '../menuitems/Transcription';
import Help from '../menuitems/Help';
import MoreActions from '../moreactions/MoreActions';
import { recordingActions } from '../../store/slices/recordingSlice';
import { setLocale, } from '../../store/actions/localeActions';
import { localeList } from '../../utils/intlManager';

interface TopBarProps {
	fullscreenEnabled: boolean;
	fullscreen: boolean;
	onFullscreen: () => void;
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
	backgroundColor: theme.appBarColor,
	height: '64px',
}));

const LogoImg = styled('img')(({ theme }) => ({
	display: 'none',
	marginLeft: 20,
	[theme.breakpoints.up('sm')]: {
		display: 'block'
	}
}));

const GrowingDiv = styled('div')({
	display: 'flex',
	justifyContent: 'center',
	flexGrow: 1
});

const DividerDiv = styled('div')(({ theme }) => ({
	marginLeft: theme.spacing(3)
}));

const DesktopDiv = styled('div')(({ theme }) => ({
	display: 'none',
	[theme.breakpoints.up('md')]: {
		display: 'flex'
	}
}));

const MobileDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	[theme.breakpoints.up('md')]: {
		display: 'none'
	}
}));

const TopBar = ({
	fullscreenEnabled,
	fullscreen,
	onFullscreen
}: TopBarProps): JSX.Element => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const canLock = usePermissionSelector(permissions.CHANGE_ROOM_LOCK);
	const canPromote = usePermissionSelector(permissions.PROMOTE_PEER);
	const canRecord = useAppSelector((state) => state.me.canRecord);
	const canTranscribe = useAppSelector((state) => state.me.canTranscribe);
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const audioOnly = useAppSelector((state) => state.settings.audioOnly);
	const fullscreenConsumer = useAppSelector(fullscreenConsumerSelector);
	const unread = useAppSelector(unreadSelector);
	const lobbyPeersLength = useAppSelector(lobbyPeersLengthSelector);
	const recording = useAppSelector((state) => state.recording.recording);

	const [ mobileMoreAnchorEl, setMobileMoreAnchorEl ] = useState<HTMLElement | null>();
	const [ extraMenuAnchorEl, setExtraMenuAnchorEl ] = useState<HTMLElement | null>();
	const [ localeMenuAnchorEl, setLocaleMenuAnchorEl ] = useState<HTMLElement | null>();

	const locale = useAppSelector((state) => state.settings.locale) ?? 'en';
	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);
	const currentLocale = localeList.find((l) => l.locale.some((lc) => locale.startsWith(lc))) ?? localeList[0];

	const handleMenuClose = () => setMobileMoreAnchorEl(null);
	const handleExtraMenuClose = () => setExtraMenuAnchorEl(null);

	const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
	const isExtraMenuOpen = Boolean(extraMenuAnchorEl);

	const roomCreationTimestamp = useAppSelector(roomSessionCreationTimestampSelector);
	const [ meetingDuration, setMeetingDuration ] = useState<number>(0);

	const formatDuration = (duration: number) => {
		const durationInSeconds = Math.round(duration / 1000);

		const hours = Math.floor(durationInSeconds / 3600);
		const minutes = Math.floor((durationInSeconds - (hours * 3600)) / 60);
		const seconds = durationInSeconds - (minutes * 60) - (hours * 3600);

		const formattedElements: Array<string> = new Array(3);

		formattedElements[0] = seconds < 10 ? '0'.concat(seconds.toString()) : seconds.toString();
		formattedElements[1] = (minutes < 10 ?
			'0'.concat(minutes.toString()) : minutes.toString()
		).concat(':');
		formattedElements[2] = hours.toString().concat(':');

		return (hours ? formattedElements[2] : '') + formattedElements[1] + formattedElements[0];
	};

	useEffect(() => {
		if (roomCreationTimestamp) {
			const interval = 1000;
			let expected = Date.now() + interval;

			const driftAwareTimer = () => {
				const dt = Date.now() - expected;

				expected += interval;
				setMeetingDuration(Date.now() - roomCreationTimestamp);

				setTimeout(driftAwareTimer, Math.max(0, interval - dt));
			};

			const computeDuration = setTimeout(driftAwareTimer, interval);

			return () => clearTimeout(computeDuration);
		}
	}, []);

	return (
		<Fragment>
			<StyledAppBar position='fixed'>
				<Toolbar sx={{ margin: 'auto 0' }}>
					<PulsingBadge
						color='secondary'
						badgeContent={unread}
						onClick={() => dispatch(drawerActions.toggle())}
					>
						<IconButton
							color='inherit'
							aria-label={openDrawerLabel()}
							size='small'
						>
							<MenuIcon />
						</IconButton>
					</PulsingBadge>
					{ theme.logo ?
						<LogoImg alt='Logo' src={theme.logo}/> :
						<Typography variant='h6' noWrap color='inherit'>
							{edumeetConfig.title}
						</Typography>
					}
					<GrowingDiv>
						{ Boolean(fullscreenConsumer) &&
							<>
								<MicButton
									type='iconbutton'
									offColor='error'
									disabledColor='default'
								/>
								<WebcamButton
									type='iconbutton'
									offColor='error'
									disabledColor='default'
								/>
								<ScreenshareButton type='iconbutton' />
							</>
						}
					</GrowingDiv>
					<DesktopDiv>
						<IconButton
							color='inherit'
							size='small'
							onClick={(event) => setExtraMenuAnchorEl(event.currentTarget)}
						>
							<MoreIcon />
						</IconButton>
						{ fullscreenEnabled &&
							<FullscreenButton
								type='iconbutton'
								fullscreen={fullscreen}
								onClick={onFullscreen}
							/>
						}
						<ParticipantsButton type='iconbutton' />
						<SettingsButton type='iconbutton' />
						<LockButton type='iconbutton' />
						{ canPromote && lobbyPeersLength > 0 && <LobbyButton type='iconbutton' /> }
						{ loginEnabled && <LoginButton type='iconbutton' /> }
						<Button
							color='inherit'
							size='small'
							disabled={localeInProgress}
							onClick={(event) => setLocaleMenuAnchorEl(event.currentTarget)}
							sx={{ fontWeight: 'bold', minWidth: 0 }}
						>
							{ currentLocale.file.toUpperCase() }
						</Button>
						<Menu
							anchorEl={localeMenuAnchorEl}
							open={Boolean(localeMenuAnchorEl)}
							onClose={() => setLocaleMenuAnchorEl(null)}
							anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
							transformOrigin={{ vertical: 'top', horizontal: 'right' }}
						>
							{ localeList.map(({ name, file, locale: localeValues }) => (
								<MenuItem
									key={file}
									selected={currentLocale.file === file}
									onClick={() => {
										dispatch(setLocale(localeValues[0]));
										setLocaleMenuAnchorEl(null);
									}}
								>
									{ name }
								</MenuItem>
							)) }
						</Menu>
					</DesktopDiv>
					<MobileDiv>
						{ canRecord && <IconButton
							color={recording ? 'error' : 'inherit'}
							size='small'
							onClick={() => {
								recording ?
									dispatch(recordingActions.stop()) :
									dispatch(recordingActions.start());
							}}
						>
							{ recording ? <StopIcon /> : <RecordIcon /> }
						</IconButton> }
						{ canPromote && lobbyPeersLength > 0 && <LobbyButton type='iconbutton' /> }
						<IconButton
							aria-haspopup
							onClick={(event) => setMobileMoreAnchorEl(event.currentTarget)}
							color='inherit'
							size='small'
						>
							<MoreIcon />
						</IconButton>
					</MobileDiv>
					<DividerDiv />
					<LeaveButton />
				</Toolbar>
			</StyledAppBar>

			{ /* Extra dropdown menu (desktop) */ }
			<FloatingMenu
				anchorEl={extraMenuAnchorEl}
				open={isExtraMenuOpen}
				onClose={handleExtraMenuClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Help onClick={handleExtraMenuClose} />
				{ canTranscribe && <TranscriptionMenuItem onClick={handleExtraMenuClose} /> }
				<Filesharing onClick={handleExtraMenuClose} />
				{ !audioOnly && <ExtraVideo onClick={handleExtraMenuClose} /> }
				{ canRecord && (
					<MenuItem onClick={() => {
						handleExtraMenuClose();
						recording ?
							dispatch(recordingActions.stop()) :
							dispatch(recordingActions.start());
					}}>
						{ recording ? <StopIcon /> : <RecordIcon /> }
						<MoreActions>
							{ recording ? stopRecordingLabel() : startRecordingLabel() }
						</MoreActions>
					</MenuItem>
				)}
			</FloatingMenu>

			{ /* Mobile menu */ }
			<FloatingMenu
				anchorEl={mobileMoreAnchorEl}
				open={isMobileMenuOpen}
				onClose={handleMenuClose}
			>
				{ loginEnabled && <Login onClick={handleMenuClose} /> }
				{ canLock && <Lock onClick={handleMenuClose} /> }
				<Settings onClick={handleMenuClose} />
				<Participants onClick={handleMenuClose} />
				<Fullscreen onClick={handleMenuClose} />
				<ExtraVideo onClick={handleMenuClose} />
				<Filesharing onClick={handleMenuClose} />
				{ canTranscribe && <TranscriptionMenuItem onClick={handleMenuClose} /> }
				<Help onClick={handleMenuClose} />
			</FloatingMenu>
		</Fragment>
	);
};

export default TopBar;
