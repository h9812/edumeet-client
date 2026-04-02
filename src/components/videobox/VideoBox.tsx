import { memo, ReactNode } from 'react';
import { styled, SxProps, Theme } from '@mui/material/styles';
import { Box } from '@mui/material';

interface VideoBoxProps {
	position?: 'relative' | 'absolute';
	width?: number;
	height?: number;
	margin?: number;
	order?: number;
	zIndex?: number;
	activeSpeaker?: boolean;
	avatarSrc?: string;
	children?: ReactNode;
	sx?: SxProps<Theme>;
}

type StyledVideoBoxProps = {
	position?: 'relative' | 'absolute';
	width?: number;
	height?: number;
	margin?: number;
	order?: number;
	zIndex?: number;
	activeSpeaker?: boolean;
	avatarSrc?: string;
};

const StyledVideoBox = styled(Box)<StyledVideoBoxProps>(({
	theme,
	position,
	height,
	width,
	margin,
	order,
	zIndex,
	activeSpeaker,
	avatarSrc,
}) => ({
	position,
	width,
	height,
	margin: theme.spacing(margin || 0),
	order,
	zIndex,
	...(activeSpeaker && {
		border: theme.activeSpeakerBorder
	}),
	boxShadow: theme.videoShadow,
	backgroundColor: theme.videoBackroundColor,
	backgroundImage: avatarSrc
		? `url(${avatarSrc})`
		: `url(${theme.videoAvatarImage})`,
	backgroundPosition: avatarSrc ? 'center' : 'bottom',
	backgroundSize: avatarSrc ? 'contain' : 'auto 85%',
	backgroundRepeat: 'no-repeat',
	borderRadius: theme.videoRoundedCorners ? theme.spacing(1) : '0',
	'&:hover .media-controls-autohide': {
		opacity: 1,
	},
}));

const VideoBox = ({
	position = 'relative',
	width,
	height,
	margin,
	order,
	zIndex,
	sx,
	activeSpeaker,
	avatarSrc,
	children,
}: VideoBoxProps): JSX.Element => {
	return (
		<StyledVideoBox
			position={position}
			width={width}
			height={height}
			activeSpeaker={activeSpeaker}
			avatarSrc={avatarSrc}
			order={order}
			margin={margin}
			zIndex={zIndex}
			children={children}
			sx={sx}
		/>
	);
};

export default memo(VideoBox);