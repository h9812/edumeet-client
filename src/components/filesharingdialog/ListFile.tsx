import { Download } from '@mui/icons-material';
import { IconButton, LinearProgress, styled, Typography } from '@mui/material';
import { saveAs } from 'file-saver';
import { useContext, useEffect, useRef, useState } from 'react';
import WebTorrent, { TorrentFile } from 'webtorrent';
import { useAppDispatch } from '../../store/hooks';
import { notificationsActions } from '../../store/slices/notificationsSlice';
import { ServiceContext } from '../../store/store';
import { saveFileErrorLabel } from '../translated/translatedComponents';
import { FilesharingFile } from '../../utils/types';
import { roomSessionsActions } from '../../store/slices/roomSessionsSlice';

interface ListFilerProps {
	file: FilesharingFile;
	isMe: boolean;
}

const FileDiv = styled('div')({
	width: '100%',
	cursor: 'auto',
	display: 'flex',
	flexDirection: 'column',
});

const FileInfoDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'row',
	flexGrow: 1,
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: theme.spacing(1),
	minWidth: 0,
}));

const fileNameFromMagnet = (magnetURI: string): string => {
	const match = magnetURI.match(/[?&]dn=([^&]+)/);

	return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
};

const ListFile = ({
	file,
	isMe,
}: ListFilerProps): JSX.Element => {
	const { fileService } = useContext(ServiceContext);
	const dispatch = useAppDispatch();
	const [ torrent, setTorrent ] = useState<WebTorrent.Torrent | undefined>();
	const [ done, setDone ] = useState<boolean>(false);
	const [ progress, setProgress ] = useState<number>(0);
	const [ startInProgress, setStartInProgress ] = useState<boolean>(false);
	const shouldAutoSave = useRef(false);

	useEffect(() => {
		if (file.started || isMe) {
			const torrentFile = fileService.getTorrent(file.magnetURI);

			setTorrent(torrentFile);
			setDone(isMe || Boolean(torrentFile?.done));
			setProgress(torrentFile?.progress || 0);
		}
	}, []);

	useEffect(() => {
		if (torrent) {
			torrent.on('download', () => {
				if (torrent.progress > progress)
					setProgress(torrent.progress || 0);
			});
			torrent.on('done', () => setDone(true));

			return () => {
				if (torrent) {
					torrent.removeAllListeners('download');
					torrent.removeAllListeners('done');
				}
			};
		}
	}, [ torrent ]);

	const saveSubFile = (saveFile: TorrentFile): void => {
		saveFile.getBlob((err, blob) => {
			if (err)
				return dispatch(notificationsActions.enqueueNotification({
					message: saveFileErrorLabel(),
					options: { variant: 'error' }
				}));

			if (blob)
				saveAs(blob, saveFile.name);
		});
	};

	// Auto-save all files when download initiated by this instance completes
	useEffect(() => {
		if (done && shouldAutoSave.current && torrent?.files) {
			shouldAutoSave.current = false;
			torrent.files.forEach((subFile) => saveSubFile(subFile));
		}
	}, [ done, torrent ]);

	const startTorrent = async (): Promise<void> => {
		setStartInProgress(true);
		shouldAutoSave.current = true;

		const newTorrent = await fileService.downloadFile(file.magnetURI);

		setTorrent(newTorrent);
		dispatch(roomSessionsActions.updateFile({ ...file, started: true }));
		setStartInProgress(false);
	};

	return (
		<FileDiv>
			{ file.started || isMe ?
				torrent?.files.map((subFile, index) => (
					<FileDiv key={index}>
						<FileInfoDiv>
							<Typography variant='body2' noWrap sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
								{subFile.name}
							</Typography>
							{ done &&
								<IconButton
									size='small'
									aria-label='Save file'
									onClick={() => saveSubFile(subFile)}
								>
									<Download fontSize='small' />
								</IconButton>
							}
						</FileInfoDiv>
					</FileDiv>
				))
				:
				<FileInfoDiv>
					<Typography variant='body2' noWrap sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
						{fileNameFromMagnet(file.magnetURI)}
					</Typography>
					<IconButton
						size='small'
						aria-label='Download file'
						disabled={startInProgress}
						onClick={startTorrent}
					>
						<Download fontSize='small' />
					</IconButton>
				</FileInfoDiv>
			}
			{ file.started && !done &&
				<LinearProgress
					variant='determinate'
					value={progress * 100}
				/>
			}
		</FileDiv>
	);
};

export default ListFile;
