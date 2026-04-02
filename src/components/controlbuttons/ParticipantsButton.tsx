import {
	useAppDispatch,
	useAppSelector
} from '../../store/hooks';
import PeopleIcon from '@mui/icons-material/People';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	showParticipantsLabel,
} from '../translated/translatedComponents';
import { drawerActions } from '../../store/slices/drawerSlice';
import { peersLengthSelector } from '../../store/selectors';
import { Badge } from '@mui/material';

const ParticipantsButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const peersLength = useAppSelector(peersLengthSelector);

	const openUsersTab = () => {
		dispatch(drawerActions.toggle());
		dispatch(drawerActions.setTab('users'));
	};

	return (
		<ControlButton
			toolTip={showParticipantsLabel()}
			onClick={() => openUsersTab()}
			{ ...props }
		>
			<Badge
				badgeContent={peersLength + 1}
				sx={{ '& .MuiBadge-badge': { backgroundColor: '#518029', color: '#fff' } }}
			>
				<PeopleIcon />
			</Badge>
		</ControlButton>
	);
};

export default ParticipantsButton;