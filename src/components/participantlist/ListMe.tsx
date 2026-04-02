import { Box, IconButton, Paper, Typography, styled } from '@mui/material';
import PanIconFilled from '@mui/icons-material/PanTool';
import PanIcon from '@mui/icons-material/PanToolOutlined';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setRaisedHand } from '../../store/actions/meActions';
import { meLabel } from '../translated/translatedComponents';

const MeDiv = styled(Paper)(({ theme }) => ({
	display: 'flex',
	paddingTop: theme.spacing(1.5),
	paddingBottom: theme.spacing(1.5),
	paddingLeft: theme.spacing(0.5),
	paddingRight: theme.spacing(0.5),
	marginTop: theme.spacing(0.5),
}));

const MeInfoDiv = styled(Box)(({ theme }) => ({
	display: 'flex',
	marginLeft: theme.spacing(1),
	flexGrow: 1,
	alignItems: 'center',
	gap: theme.spacing(0.5),
}));

const MeAvatar = styled('img')({
	borderRadius: '50%',
	height: '2rem',
	width: '2rem',
	objectFit: 'cover',
	alignSelf: 'center',
});

const ListMe = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const picture = useAppSelector((state) => state.me.picture);
	const displayName = useAppSelector((state) => state.settings.displayName);
	const { raisedHand, raisedHandInProgress } = useAppSelector((state) => state.me);

	return (
		<MeDiv>
			<MeAvatar src={picture || '/images/buddy.svg'} />
			<MeInfoDiv>
				{ displayName }
				<Typography variant='caption' color='text.secondary'>
					({ meLabel() })
				</Typography>
			</MeInfoDiv>
			<IconButton
				size='small'
				disabled={raisedHandInProgress}
				onClick={() => dispatch(setRaisedHand(!raisedHand))}
			>
				{ raisedHand ? <PanIconFilled fontSize='small' /> : <PanIcon fontSize='small' /> }
			</IconButton>
		</MeDiv>
	);
};

export default ListMe;
