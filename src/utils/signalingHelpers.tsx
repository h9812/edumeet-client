import edumeetConfig from './edumeetConfig';

/**
 * Function to create the url for the signaling server.
 * 
 * @param peerId - The id of this client.
 * @param roomId - The id of the room.
 * @param authToken - Optional Firebase ID token for authentication.
 * @returns {string} The url of the signaling server.
 */
export const getSignalingUrl = (peerId: string, roomId: string, authToken?: string): string => {
	const hostname = edumeetConfig.serverHostname || window.location.hostname;
	const port = process.env.NODE_ENV !== 'production' ?
		edumeetConfig.developmentPort : edumeetConfig.productionPort;

	const tokenParam = authToken ? `&authToken=${encodeURIComponent(authToken)}` : '';

	return `wss://${hostname}:${port}/?peerId=${peerId}&roomId=${roomId}${tokenParam}`;
};