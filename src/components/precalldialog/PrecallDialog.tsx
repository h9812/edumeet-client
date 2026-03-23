import { MouseEvent, ReactNode, useState } from 'react';
import {
	Button,
	DialogContent,
	DialogTitle,
	Grid,
	Menu,
	MenuItem,
	styled,
} from '@mui/material';
import StyledDialog from '../../components/dialog/StyledDialog';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setLocale } from '../../store/actions/localeActions';
import { localeList } from '../../utils/intlManager';

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
	'&.MuiDialogContent-root': {
		padding: theme.spacing(1, 3, 2.5, 3)
	}
}));

const LogoImg = styled('img')({
	height: 36,
	display: 'block',
});

interface PrecallDialogProps {
	content?: ReactNode;
}

const PrecallDialog = ({
	content,
}: PrecallDialogProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const locale = useAppSelector((state) => state.settings.locale) ?? 'en';
	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);

	const [ anchorEl, setAnchorEl ] = useState<null | HTMLElement>(null);

	const currentLocale = localeList.find(
		(l) => l.locale.some((lc) => locale.startsWith(lc))
	) ?? localeList[0];

	const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleCloseMenu = () => {
		setAnchorEl(null);
	};

	const handleSelectLocale = (localeValue: string) => {
		dispatch(setLocale(localeValue));
		handleCloseMenu();
	};

	return (
		<StyledDialog open>
			<DialogTitle sx={{ pb: 1 }}>
				<Grid
					container
					direction='row'
					justifyContent='space-between'
					alignItems='center'
				>
					<Grid item>
						<LogoImg alt='Logo' src='/images/logo_sumplus.png' />
					</Grid>

					<Grid item>
						<Button
							onClick={handleOpenMenu}
							disabled={localeInProgress}
							size='small'
							sx={{
								fontWeight: 'bold',
								minWidth: 0,
								color: 'text.primary',
							}}
						>
							{ currentLocale.file.toUpperCase() }
						</Button>
						<Menu
							anchorEl={anchorEl}
							open={Boolean(anchorEl)}
							onClose={handleCloseMenu}
							anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
							transformOrigin={{ vertical: 'top', horizontal: 'right' }}
						>
							{ localeList.map(({ name, file, locale: localeValues }) => (
								<MenuItem
									key={file}
									selected={currentLocale.file === file}
									onClick={() => handleSelectLocale(localeValues[0])}
								>
									{ name }
								</MenuItem>
							)) }
						</Menu>
					</Grid>
				</Grid>
			</DialogTitle>
			<StyledDialogContent>
				{ content }
			</StyledDialogContent>
		</StyledDialog>
	);
};

export default PrecallDialog;
