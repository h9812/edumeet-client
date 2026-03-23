import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Stack } from '@mui/material';
import randomString from 'random-string';
import TextInputField from '../../components/textinputfield/TextInputField';
import { joinLabel, roomNameLabel } from '../../components/translated/translatedComponents';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';
import StyledBackground from '../../components/StyledBackground';

const ACTIVE_COLOR = '#518029';

const LandingPage = (): JSX.Element => {
	const navigate = useNavigate();
	const [ roomId, setRoomId ] = useState(randomString({ length: 8 }).toLowerCase());

	const onClicked = () => {
		navigate(`/${roomId}`);
	};

	return (
		<StyledBackground>
			<PrecallDialog
				content={
					<Stack spacing={2} mt={1}>
						<TextInputField
							label={roomNameLabel()}
							value={roomId}
							setValue={setRoomId}
							onEnter={onClicked}
							randomizeOnBlank
							autoFocus
						/>
						<Stack direction='row' justifyContent='flex-end'>
							<Button
								onClick={onClicked}
								variant='contained'
								disabled={!roomId}
								sx={{
									bgcolor: ACTIVE_COLOR,
									'&:hover': { bgcolor: '#3e6120' },
									'&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
								}}
							>
								{ joinLabel() }
							</Button>
						</Stack>
					</Stack>
				}
			/>
		</StyledBackground>
	);
};

export default LandingPage;
