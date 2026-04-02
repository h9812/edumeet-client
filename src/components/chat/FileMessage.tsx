import { Typography, useTheme } from '@mui/material';
import { FormattedTime } from 'react-intl';
import { FilesharingFile } from '../../utils/types';
import ListFile from '../filesharingdialog/ListFile';
import { meLabel } from '../translated/translatedComponents';
import {
	StyledMessage,
	StyledMessageAvatar,
	StyledMessageContent,
	StyledMessageTime,
} from './Message';

interface FileMessageProps {
	file: FilesharingFile;
	isMe: boolean;
}

const FileMessage = ({ file, isMe }: FileMessageProps): JSX.Element => {
	const theme = useTheme();

	return (
		<StyledMessage
			sx={{
				alignSelf: isMe ? 'flex-end' : 'flex-start',
				marginTop: theme.spacing(1),
				borderRadius: 4,
			}}
		>
			<StyledMessageAvatar>
				<img alt='A' src='/images/buddy.svg' />
			</StyledMessageAvatar>
			<StyledMessageContent>
				<Typography variant='subtitle1'>
					<b>
						{ isMe ? meLabel() : <b>{file.displayName}</b> }
						{' - '}
						<FormattedTime value={new Date(file.timestamp || Date.now())} />
					</b>
				</Typography>
				<ListFile file={file} isMe={isMe} />
			</StyledMessageContent>
		</StyledMessage>
	);
};

export default FileMessage;
