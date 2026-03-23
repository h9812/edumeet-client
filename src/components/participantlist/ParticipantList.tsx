import { Box, Typography, styled } from '@mui/material';
import { Flipped, Flipper } from 'react-flip-toolkit';
import {
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { inParentRoomSelector, parentParticipantListSelector } from '../../store/selectors';
import { permissions } from '../../utils/roles';
import { participantsLabel } from '../translated/translatedComponents';
import ListMe from './ListMe';
import ListPeer from './ListPeer';

const ParticipantListDiv = styled(Box)(({ theme }) => ({
	width: '100%',
	overflowY: 'auto',
	padding: theme.spacing(1)
}));

const ListHeader = styled(Typography)(({ theme }) => ({
	marginTop: theme.spacing(3),
	fontWeight: 'bolder'
}));

const ParticipantList = (): JSX.Element => {
	const isModerator = usePermissionSelector(permissions.MODERATE_ROOM);
	const participants = useAppSelector(parentParticipantListSelector);
	const inParent = useAppSelector(inParentRoomSelector);

	return (
		<ParticipantListDiv>
			{ (inParent || participants.length > 0) &&
				<>
					<ListHeader>
						{ participantsLabel() }
					</ListHeader>
					{ inParent && <ListMe /> }
					<Flipper flipKey={participants}>
						{ participants.map((peer) => (
							<Flipped key={peer.id} flipId={peer.id}>
								<ListPeer key={peer.id} peer={peer} isModerator={isModerator} />
							</Flipped>
						)) }
					</Flipper>
				</>
			}
		</ParticipantListDiv>
	);
};

export default ParticipantList;
