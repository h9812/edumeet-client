import { styled } from '@mui/material';
import { useState } from 'react';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

const ChatDiv = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
	overflowY: 'auto',
});

const Chat = (): JSX.Element => {
	const [ sortOrder, setSortOrder ] = useState<'asc' | 'desc'>('asc');

	const handleSortToggle = () => {
		setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
	};

	return (
		<ChatDiv>
			<ChatHistory sortOrder={sortOrder} />
			<ChatInput
				sortOrder={sortOrder}
				onSortToggle={handleSortToggle}
			/>
		</ChatDiv>
	);
};

export default Chat;
