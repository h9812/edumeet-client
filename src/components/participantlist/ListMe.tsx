import { Box, Paper, Typography, styled } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import { meLabel } from '../translated/translatedComponents';

const MeDiv = styled(Paper)(({ theme }) => ({
	display: 'flex',
	padding: theme.spacing(0.5),
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
	const picture = useAppSelector((state) => state.me.picture);
	const displayName = useAppSelector((state) => state.settings.displayName);

	return (
		<MeDiv>
			<MeAvatar src={picture ?? '/images/buddy.svg'} />
			<MeInfoDiv>
				{ displayName }
				<Typography variant='caption' color='text.secondary'>
					({ meLabel() })
				</Typography>
			</MeInfoDiv>
		</MeDiv>
	);
};

export default ListMe;
