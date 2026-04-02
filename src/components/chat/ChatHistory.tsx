import { Button, styled } from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { chatMessagesSelector, filesSelector } from '../../store/selectors';
import { ChatMessage, FilesharingFile } from '../../utils/types';
import ScrollingList from '../scrollinglist/ScrollingList';
import { chatScrollToBottomLabel } from '../translated/translatedComponents';
import FileMessage from './FileMessage';
import Message, { MessageFormat } from './Message';
import { RootState } from '../../store/store';

const ScrollToBottom = styled(Button)(({ theme }) => ({
	marginLeft: theme.spacing(4),
	marginRight: theme.spacing(4),
	marginBottom: theme.spacing(1),
}));

type ChatItem =
	| { kind: 'message'; key: string; data: ChatMessage }
	| { kind: 'file'; key: string; data: FilesharingFile };

interface ChatHistoryProps {
	sortOrder: 'asc' | 'desc';
}

const ChatHistory = ({ sortOrder }: ChatHistoryProps): JSX.Element => {
	const chatHistoryRef = useRef<ScrollingList>(null);
	const chatMessages = useAppSelector(chatMessagesSelector);
	const sharedFiles = useAppSelector(filesSelector);
	const [ atBottom, setAtBottom ] = useState(true);
	const meId = useAppSelector((state) => state.me.id);
	const mePicture = useAppSelector((state) => state.me.picture);
	const peers = useAppSelector((state: RootState) => state.peers);

	const getPeerPicture = (peerId: string): string | undefined => {
		if (peerId === meId) return mePicture || undefined;

		return peers[peerId]?.picture || undefined;
	};

	const allItems = useMemo((): ChatItem[] => {
		const items: ChatItem[] = [
			...chatMessages.map((m, i): ChatItem => ({
				kind: 'message',
				key: `msg-${i}-${m.peerId}`,
				data: m,
			})),
			...sharedFiles.map((f, i): ChatItem => ({
				kind: 'file',
				key: `file-${i}-${f.magnetURI}`,
				data: f,
			})),
		];

		return items.sort((a, b) => {
			const ta = a.data.timestamp ?? 0;
			const tb = b.data.timestamp ?? 0;

			return sortOrder === 'asc' ? ta - tb : tb - ta;
		});
	}, [ chatMessages, sharedFiles, sortOrder ]);

	const getMessageFormat = (index: number): MessageFormat => {
		const item = allItems[index];

		if (item.kind !== 'message') return 'single';

		const curr = item.data.peerId;
		const prevItem = allItems[index - 1];
		const nextItem = allItems[index + 1];
		const prev = prevItem?.kind === 'message' ? prevItem.data.peerId : undefined;
		const next = nextItem?.kind === 'message' ? nextItem.data.peerId : undefined;

		if (curr !== prev && curr === next) return 'combinedBegin';
		if (curr === prev && curr === next) return 'combinedMiddle';
		if (curr === prev && curr !== next) return 'combinedEnd';

		return 'single';
	};

	return (
		<>
			<ScrollingList
				ref={chatHistoryRef}
				onScroll={(isAtBottom: boolean) => {
					setAtBottom(isAtBottom);
				}}
			>
				{ allItems.map((item, i) => {
					if (item.kind === 'message') {
						return (
							<Message
								key={item.key}
								time={item.data.timestamp}
								name={item.data.displayName}
								text={item.data.text}
								isMe={item.data.peerId === meId}
								format={getMessageFormat(i)}
								picture={getPeerPicture(item.data.peerId)}
							/>
						);
					}

					return (
						<FileMessage
							key={item.key}
							file={item.data}
							isMe={item.data.peerId === meId}
						/>
					);
				})}
			</ScrollingList>
			{ !atBottom &&
				<ScrollToBottom
					variant='contained'
					onClick={() => chatHistoryRef.current?.scrollToBottom()}
				>
					{ chatScrollToBottomLabel() }
				</ScrollToBottom>
			}
		</>
	);
};

export default ChatHistory;
