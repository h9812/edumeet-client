import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { Logger } from 'edumeet-common';

const logger = new Logger('FirebaseService');

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export interface FirebaseConfig {
	apiKey: string;
	authDomain: string;
	projectId: string;
	storageBucket?: string;
	messagingSenderId?: string;
	appId: string;
}

export const initFirebase = (config: FirebaseConfig): Auth => {
	if (auth) return auth;

	logger.debug('initFirebase() [projectId: %s]', config.projectId);

	app = initializeApp(config);
	auth = getAuth(app);

	return auth;
};

export const getFirebaseAuth = (): Auth | null => auth;

export const getFirebaseApp = (): FirebaseApp | null => app;
