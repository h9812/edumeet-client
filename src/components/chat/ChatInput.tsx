import {
	AttachFile,
	FormatBold,
	FormatItalic,
	FormatUnderlined,
	SaveAlt,
	Send,
	Sort,
} from '@mui/icons-material';
import {
	Box,
	IconButton,
	styled,
	Tooltip,
} from '@mui/material';
import { ChangeEvent, KeyboardEvent, MouseEvent, useRef, useState } from 'react';
import { sendChat } from '../../store/actions/chatActions';
import { sendFiles } from '../../store/actions/filesharingActions';
import { useAppDispatch, useAppSelector, usePermissionSelector } from '../../store/hooks';
import { chatMessagesSelector, filesSelector } from '../../store/selectors';
import { permissions } from '../../utils/roles';
import { chatInputLabel } from '../translated/translatedComponents';

const ChatInputDiv = styled('div')(({ theme }) => ({
	marginLeft: theme.spacing(1),
	marginRight: theme.spacing(1),
}));

const InputWrapper = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'}`,
	borderRadius: theme.shape.borderRadius,
	padding: theme.spacing(0.75, 0.5, 0.75, 1.75),
	marginTop: theme.spacing(1),
	marginBottom: theme.spacing(0.5),
	transition: 'border-color 0.2s, border-width 0.2s',
	'&:focus-within': {
		borderColor: theme.palette.primary.main,
		borderWidth: 2,
		padding: theme.spacing(0.625, 0.375, 0.625, 1.625),
	},
}));

const EditableContent = styled('div')(({ theme }) => ({
	flex: 1,
	outline: 'none',
	minHeight: '24px',
	maxHeight: '120px',
	overflowY: 'auto',
	fontSize: theme.typography.body1.fontSize,
	fontFamily: theme.typography.fontFamily,
	color: theme.palette.text.primary,
	lineHeight: '1.4375em',
	wordBreak: 'break-word',
	caretColor: theme.palette.primary.main,
	'&:empty:before': {
		content: 'attr(data-placeholder)',
		color: theme.palette.text.disabled,
		pointerEvents: 'none',
		display: 'block',
	},
	'&[contenteditable="false"]': {
		color: theme.palette.text.disabled,
		cursor: 'not-allowed',
	},
	'& b, & strong': { fontWeight: 'bold' },
	'& i, & em': { fontStyle: 'italic' },
	'& u': { textDecoration: 'underline' },
}));

const ToolbarDiv = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	paddingBottom: 4,
});

interface ChatInputProps {
	sortOrder: 'asc' | 'desc';
	onSortToggle: () => void;
}

const ChatInput = ({ sortOrder, onSortToggle }: ChatInputProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const [ hasContent, setHasContent ] = useState(false);
	const canChat = usePermissionSelector(permissions.SEND_CHAT);
	const canShareFile = usePermissionSelector(permissions.SHARE_FILE);
	const editableRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const chatMessages = useAppSelector(chatMessagesSelector);
	const sharedFiles = useAppSelector(filesSelector);
	const meId = useAppSelector((state) => state.me.id);

	const handleInput = () => {
		const text = editableRef.current?.innerText?.trim() ?? '';

		setHasContent(text.length > 0);
	};

	const handleSendMessage = () => {
		const div = editableRef.current;

		if (!div) return;

		const text = div.innerText.trim();
		const html = div.innerHTML.trim();

		if (text) {
			dispatch(sendChat(html));
			div.innerHTML = '';
			setHasContent(false);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	// Use onMouseDown + preventDefault to keep focus and selection in the
	// contenteditable while applying the format command.
	const applyFormat = (e: MouseEvent, command: string) => {
		e.preventDefault();
		editableRef.current?.focus();
		document.execCommand(command); // eslint-disable-line
	};

	const handleSaveChat = () => {
		const fileNameFromMagnet = (magnetURI: string): string => {
			const match = magnetURI.match(/[?&]dn=([^&]+)/);

			return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : 'Unknown file';
		};

		type ExportItem =
			| { kind: 'message'; timestamp: number; sender: string; isMe: boolean; text: string }
			| { kind: 'file'; timestamp: number; sender: string; fileName: string };

		const items: ExportItem[] = [
			...chatMessages.map((msg): ExportItem => ({
				kind: 'message',
				timestamp: msg.timestamp ?? 0,
				sender: msg.displayName || 'Unknown',
				isMe: msg.peerId === meId,
				text: msg.text || '',
			})),
			...sharedFiles.map((f): ExportItem => ({
				kind: 'file',
				timestamp: f.timestamp ?? 0,
				sender: f.displayName || 'Unknown',
				fileName: fileNameFromMagnet(f.magnetURI),
			})),
		].sort((a, b) => a.timestamp - b.timestamp);

		const renderItem = (item: ExportItem): string => {
			const time = new Date(item.timestamp).toLocaleString();

			if (item.kind === 'message') {
				return `  <div class="message${item.isMe ? ' me' : ''}">
    <div class="message-header">${item.sender} &mdash; ${time}</div>
    <div class="message-text">${item.text}</div>
  </div>`;
			}

			return `  <div class="file-item${item.sender === meId ? ' me' : ''}">
    <div class="file-header">${item.sender} &mdash; ${time}</div>
    <div class="file-name">📎 ${item.fileName}</div>
  </div>`;
		};

		const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chat History</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .meta { color: #888; font-size: 13px; margin-bottom: 20px; }
    .message, .file-item { margin: 8px 0; padding: 10px 14px; border-radius: 8px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .message.me { background: #dcf8c6; }
    .message-header, .file-header { font-size: 12px; color: #888; margin-bottom: 4px; font-weight: bold; }
    .message-text { font-size: 14px; word-break: break-word; }
    .file-name { font-size: 14px; color: #555; }
  </style>
</head>
<body>
  <h1>Chat History</h1>
  <p class="meta">Saved on ${new Date().toLocaleString()}</p>
  ${items.map(renderItem).join('\n')}
</body>
</html>`;

		const blob = new Blob([ html ], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');

		anchor.href = url;
		anchor.download = `chat-history-${Date.now()}.html`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;

		if (files?.length)
			dispatch(sendFiles(files));

		event.target.value = '';
	};

	return (
		<ChatInputDiv>
			<InputWrapper>
				<EditableContent
					ref={editableRef}
					contentEditable={canChat}
					data-placeholder={chatInputLabel()}
					onInput={handleInput}
					onKeyDown={handleKeyDown}
					suppressContentEditableWarning
				/>
				<IconButton
					aria-label='Send message'
					size='small'
					disabled={!canChat || !hasContent}
					onMouseDown={(e: MouseEvent) => {
						e.preventDefault();
						handleSendMessage();
					}}
				>
					<Send />
				</IconButton>
			</InputWrapper>
			<ToolbarDiv>
				<Box>
					<Tooltip title='Bold'>
						<IconButton size='small' onMouseDown={(e) => applyFormat(e, 'bold')}>
							<FormatBold fontSize='small' />
						</IconButton>
					</Tooltip>
					<Tooltip title='Italic'>
						<IconButton size='small' onMouseDown={(e) => applyFormat(e, 'italic')}>
							<FormatItalic fontSize='small' />
						</IconButton>
					</Tooltip>
					<Tooltip title='Underline'>
						<IconButton size='small' onMouseDown={(e) => applyFormat(e, 'underline')}>
							<FormatUnderlined fontSize='small' />
						</IconButton>
					</Tooltip>
				</Box>
				<Box>
					<Tooltip title={sortOrder === 'asc' ? 'Oldest first — click for newest first' : 'Newest first — click for oldest first'}>
						<IconButton size='small' onClick={onSortToggle}>
							<Sort
								fontSize='small'
								sx={sortOrder === 'desc' ? { transform: 'scaleY(-1)' } : undefined}
							/>
						</IconButton>
					</Tooltip>
					<Tooltip title='Save chat as HTML'>
						<IconButton size='small' onClick={handleSaveChat}>
							<SaveAlt fontSize='small' />
						</IconButton>
					</Tooltip>
					{ canShareFile &&
						<Tooltip title='Attach file'>
							<IconButton size='small' onClick={() => fileInputRef.current?.click()}>
								<AttachFile fontSize='small' />
							</IconButton>
						</Tooltip>
					}
					<input
						type='file'
						ref={fileInputRef}
						style={{ display: 'none' }}
						onChange={handleFileChange}
					/>
				</Box>
			</ToolbarDiv>
		</ChatInputDiv>
	);
};

export default ChatInput;
