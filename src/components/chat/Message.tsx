import { styled, Typography, useTheme } from '@mui/material';
import { FormattedTime } from 'react-intl';
import { meLabel } from '../translated/translatedComponents';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export type MessageFormat = 'single' | 'combinedBegin' | 'combinedMiddle' | 'combinedEnd';

export const StyledMessage = styled('div')(({ theme }) => ({
	display: 'flex',
	flexShrink: 0,
	backgroundColor: theme.chatColor,
	boxShadow: 'none',
	padding: theme.spacing(0),
	wordWrap: 'break-word',
	wordBreak: 'break-all',
	width: '100%',
	borderRadius: 4,
}));

export const StyledMessageAvatar = styled('div')({
	dispay: 'flex',
	width: '75px',
	display: 'flex',
	justifyContent: 'center',
	'& img': {
		borderRadius: '50%',
		width: '2rem',
		height: '2rem',
		alignSelf: 'center',
		objectFit: 'cover',
		backgroundColor: '#e0e0e085'
	}
});

export const StyledMessageTime = styled('div')({
	width: '75px',
	alignSelf: 'center',
	fontSize: '13px',
	color: '#999999',
	dispay: 'flex',
	display: 'flex',
	justifyContent: 'center'
});

export const StyledMessageContent = styled('div')(({ theme }) => ({
	margin: theme.spacing(1),
	minWidth: 0,
	overflow: 'hidden',
	flex: 1,
	'& p': {
		margin: '0'
	}
}));

const allowedHTMLNodes = {
	ALLOWED_TAGS: [
		'a', 'b', 'strong', 'i',
		'em', 'u', 'strike', 'p',
		'br'
	],
	ALLOWED_ATTR: [ 'href', 'target', 'title' ]
};

interface MessageProps {
	time?: number;
	name?: string;
	text?: string;
	isMe: boolean;
	format: MessageFormat;
	picture?: string;
}

const Message = ({
	time,
	name,
	text,
	isMe,
	format,
	picture,
}: MessageProps): JSX.Element => {
	const theme = useTheme();
	const linkRenderer = new marked.Renderer();

	linkRenderer.link = (href, title, linkText) => {
		title = title ? title : href;
		linkText = linkText ?? href;

		return `<a target='_blank' href='${href}' title='${title}'>${linkText}</a>`;
	};

	return (
		<StyledMessage
			sx={{
				...(isMe ? {
					alignSelf: 'flex-end'
				} : {
					alignSelf: 'flex-start'
				}),
				...(format === 'single' && {
					marginTop: theme.spacing(1),
					borderRadius: 4,
				}),
				...(format === 'combinedBegin' && {
					marginTop: theme.spacing(1),
					marginBottom: 1,
					borderRadius: 4,
				}),
				...(format === 'combinedMiddle' && {
					marginBottom: 1,
					borderRadius: 4,
				}),
				...(format === 'combinedEnd' && {
					marginBottom: 0,
					borderRadius: 4,
				})
			}}
		>
			<StyledMessageAvatar>
				{ (format === 'single' || format ==='combinedBegin') ?
					<img alt='A' src={picture || '/images/buddy.svg'} />
					:
					<StyledMessageTime>
						<FormattedTime value={new Date(time || Date.now())} />
					</StyledMessageTime>
				}
			</StyledMessageAvatar>
			<StyledMessageContent>
				{(format === 'single' || format ==='combinedBegin') &&
					<Typography variant='subtitle1'>
						<b>
							{ isMe ? meLabel() : <b>{name}</b> } - <FormattedTime
								value={new Date(time || Date.now())}
							/>
						</b>
					</Typography>
				}
				{ text &&
					<Typography
						variant='subtitle1'
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(
							marked.parse(text, { renderer: linkRenderer }),
							allowedHTMLNodes
						) }}
					/>
				}
			</StyledMessageContent>
		</StyledMessage>
	);
};

export default Message;