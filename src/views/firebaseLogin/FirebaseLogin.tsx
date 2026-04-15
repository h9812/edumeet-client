import { useState } from 'react';
import {
	Box,
	Button,
	CircularProgress,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { Email, Lock } from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth } from '../../services/firebaseService';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';
import { Logger } from 'edumeet-common';

const logger = new Logger('FirebaseLogin');

interface FirebaseLoginProps {
	onLoginSuccess: (idToken: string, displayName?: string) => void;
}

const FirebaseLogin = ({ onLoginSuccess }: FirebaseLoginProps): JSX.Element => {
	const [ email, setEmail ] = useState('');
	const [ password, setPassword ] = useState('');
	const [ error, setError ] = useState('');
	const [ loading, setLoading ] = useState(false);

	const handleLogin = async () => {
		const auth = getFirebaseAuth();

		if (!auth) {
			setError('Firebase is not configured');

			return;
		}

		setLoading(true);
		setError('');

		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const idToken = await userCredential.user.getIdToken();
			const displayName = userCredential.user.displayName || undefined;

			logger.debug('login success [uid: %s]', userCredential.user.uid);
			onLoginSuccess(idToken, displayName);
		} catch (err: unknown) {
			logger.error('login failed [error: %o]', err as Record<string, unknown>);

			const errorCode = (err as { code?: string })?.code;
			const messages: Record<string, string> = {
				'auth/user-not-found': 'User not found',
				'auth/wrong-password': 'Wrong password',
				'auth/invalid-email': 'Invalid email',
				'auth/invalid-credential': 'Invalid email or password',
			};

			setError(messages[errorCode ?? ''] || 'Login failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' && email && password && !loading) {
			handleLogin();
		}
	};

	return (
		<PrecallDialog
			content={
				<Stack spacing={2} mt={1}>
					<Typography variant='subtitle1' fontWeight='bold'>
						Sign in to join meeting
					</Typography>
					{error && (
						<Typography color='error' variant='body2'>
							{error}
						</Typography>
					)}
					<TextField
						label='Email'
						type='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						onKeyDown={handleKeyDown}
						autoFocus
						fullWidth
						size='small'
						InputProps={{
							startAdornment: (
								<Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
									<Email fontSize='small' />
								</Box>
							),
						}}
					/>
					<TextField
						label='Password'
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						onKeyDown={handleKeyDown}
						fullWidth
						size='small'
						InputProps={{
							startAdornment: (
								<Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
									<Lock fontSize='small' />
								</Box>
							),
						}}
					/>
					<Button
						onClick={handleLogin}
						variant='contained'
						disabled={!email || !password || loading}
						fullWidth
					>
						{loading ? <CircularProgress size={24} /> : 'Sign In'}
					</Button>
				</Stack>
			}
		/>
	);
};

export default FirebaseLogin;
