import {
	useAppSelector,
	usePeer,
	usePeerConsumers
} from '../../store/hooks';
import PanIcon from '@mui/icons-material/PanTool';
import { styled } from '@mui/material';
import FullscreenVideoButton from '../controlbuttons/FullscreenVideoButton';
import PeerActionsButton from '../controlbuttons/PeerActionsButton';
import WindowedVideoButton from '../controlbuttons/WindowedVideoButton';
import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import PeerStatsView from '../peerstatsview/PeerStatsView';
import PeerTranscription from '../peertranscription/PeerTranscription';
import StateIndicators from '../stateindicators/StateIndicators';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';

const RaisedHandIndicator = styled('div')(({ theme }) => ({
	position: 'absolute',
	bottom: theme.spacing(1),
	right: theme.spacing(1),
	zIndex: 22,
	color: theme.palette.warning.main,
	display: 'flex',
}));

interface PeerProps {
	key: string;
	id: string;
	spacing: number;
	style: Record<'width' | 'height', number>
}

const Peer = ({
	id,
	spacing,
	style
}: PeerProps): JSX.Element => {
	const {
		micConsumer,
		webcamConsumer,
		screenConsumer,
		extraVideoConsumers
	} = usePeerConsumers(id);
	const hideNonVideo = useAppSelector((state) => state.settings.hideNonVideo);
	const peer = usePeer(id);
	// const activeSpeaker = useAppSelector((state) => id === state.room.activeSpeakerId);
	const showParticipant = !hideNonVideo || (hideNonVideo && webcamConsumer);
	const showStats = useAppSelector((state) => state.ui.showStats);

	return (
		<>
			{ showParticipant && (
				<VideoBox
					// activeSpeaker={activeSpeaker}
					order={1}
					margin={spacing}
					width={style.width}
					height={style.height}
					zIndex={0}
					avatarSrc={!webcamConsumer && peer?.picture ? peer.picture : undefined}
				>
					<StateIndicators peerId={id} />
					{ peer?.raisedHand && (
						<RaisedHandIndicator>
							<PanIcon fontSize='small' />
						</RaisedHandIndicator>
					) }
					<DisplayName displayName={peer?.displayName} />
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						{ webcamConsumer && (
							<>
								<FullscreenVideoButton
									consumerId={webcamConsumer.id}
								/>
								<WindowedVideoButton
									consumerId={webcamConsumer.id}
								/>
							</>
						)}
						<PeerActionsButton peerId={id} />
					</MediaControls>
					<PeerTranscription id={id} />
					{ micConsumer && <Volume consumer={micConsumer} /> }
					{ webcamConsumer && <VideoView
						consumer={webcamConsumer}
						contain
					/> }
					{webcamConsumer && showStats && <PeerStatsView consumerId={webcamConsumer.id}/>}
				</VideoBox>
			)}
			
			{ screenConsumer && (
				<VideoBox
					// activeSpeaker={activeSpeaker}
					order={2}
					margin={spacing}
					width={style.width}
					height={style.height}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={screenConsumer.id} />
						<WindowedVideoButton consumerId={screenConsumer.id} />
					</MediaControls>
					<VideoView consumer={screenConsumer} contain />
					{showStats && <PeerStatsView consumerId={screenConsumer.id}/>}
				</VideoBox>
			)}
			{ extraVideoConsumers?.map((consumer) => (
				<VideoBox
					// activeSpeaker={activeSpeaker}
					order={3}
					margin={spacing}
					key={consumer.id}
					width={style.width}
					height={style.height}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={consumer.id} />
						<WindowedVideoButton consumerId={consumer.id} />
					</MediaControls>
					<VideoView consumer={consumer} />
					{showStats && <PeerStatsView consumerId={consumer.id}/>}
				</VideoBox>
			)) }
		</>
	);
};

export default Peer;