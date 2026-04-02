import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import {
	Box,
	Button,
	IconButton,
	ListItem,
	ListItemIcon,
	ListItemText,
	Snackbar,
	Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setPicture } from '../../store/actions/meActions';
import {
	profilePhotoLabel,
	profilePhotoHintLabel,
	profilePhotoSetLabel,
	profilePhotoRemoveLabel,
	profilePhotoSizeErrorLabel,
	profilePhotoTypeErrorLabel,
} from '../translated/translatedComponents';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ACCEPTED_TYPES = [ 'image/jpeg', 'image/jpg', 'image/png' ];
const AVATAR_MAX_SIZE = 1024; // px — cạnh dài tối đa, giữ nguyên tỉ lệ

const resizeImageToDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const img = new Image();
		const objectUrl = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(objectUrl);

			const { width, height } = img;
			let targetW = width;
			let targetH = height;

			if (width > AVATAR_MAX_SIZE || height > AVATAR_MAX_SIZE) {
				if (width >= height) {
					targetW = AVATAR_MAX_SIZE;
					targetH = Math.round(height * AVATAR_MAX_SIZE / width);
				} else {
					targetH = AVATAR_MAX_SIZE;
					targetW = Math.round(width * AVATAR_MAX_SIZE / height);
				}
			}

			const canvas = document.createElement('canvas');

			canvas.width = targetW;
			canvas.height = targetH;
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				reject(new Error('Canvas context unavailable'));

				return;
			}
			ctx.drawImage(img, 0, 0, targetW, targetH);
			resolve(canvas.toDataURL('image/jpeg', 1.0));
		};
		img.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error('Image load failed'));
		};
		img.src = objectUrl;
	});

const ProfilePhotoSettings = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const picture = useAppSelector((state) => state.me.picture);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [ errorMessage, setErrorMessage ] = useState<string>('');

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];

		e.target.value = '';
		if (!file) return;

		if (!ACCEPTED_TYPES.includes(file.type)) {
			setErrorMessage(`${file.name}${profilePhotoTypeErrorLabel()}`);

			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			setErrorMessage(`${file.name}${profilePhotoSizeErrorLabel()}`);

			return;
		}

		try {
			const dataUrl = await resizeImageToDataUrl(file);

			dispatch(setPicture(dataUrl));
		} catch {
			setErrorMessage(`${file.name}${profilePhotoTypeErrorLabel()}`);
		}
	};

	const handleRemove = () => {
		dispatch(setPicture(''));
	};

	return (
		<>
			<Snackbar
				open={Boolean(errorMessage)}
				autoHideDuration={4000}
				onClose={() => setErrorMessage('')}
				message={errorMessage}
			/>
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<AccountCircleIcon />
				</ListItemIcon>
				<ListItemText primary={ profilePhotoLabel() } />
			</ListItem>
			<ListItem>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						width: '100%',
						gap: 1,
						pb: 1,
					}}
				>
					{ picture ? (
						<Box sx={{ position: 'relative', display: 'inline-flex' }}>
							<Box
								component='img'
								src={picture}
								sx={{
									maxWidth: 160,
									maxHeight: 120,
									borderRadius: 1,
									display: 'block',
									objectFit: 'contain',
									border: '1px solid',
									borderColor: 'divider',
								}}
							/>
							<IconButton
								size='small'
								onClick={handleRemove}
								title={ profilePhotoRemoveLabel() }
								sx={{
									position: 'absolute',
									top: -12,
									right: -12,
									padding: 0,
									color: 'error.main',
									backgroundColor: 'background.paper',
									'&:hover': { backgroundColor: 'background.paper' },
								}}
							>
								<CancelIcon fontSize='medium' />
							</IconButton>
						</Box>
					) : (
						<PhotoLibraryIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
					) }
					<Typography variant='caption' color='text.secondary' textAlign='center'>
						{ profilePhotoHintLabel() }
					</Typography>
					<Button
						variant='contained'
						size='small'
						onClick={() => fileInputRef.current?.click()}
					>
						{ profilePhotoSetLabel() }
					</Button>
				</Box>
				<input
					ref={fileInputRef}
					type='file'
					accept='image/jpeg,image/jpg,image/png'
					style={{ display: 'none' }}
					onChange={handleFileChange}
				/>
			</ListItem>
		</>
	);
};

export default ProfilePhotoSettings;
