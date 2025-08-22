import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let auth: Auth;
let db: Firestore;

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    // Use environment variables for production
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Parse the service account JSON from environment variable
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      // For local development, you can use default credentials
      // or load from a local service account file
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }

    auth = getAuth(app);
    db = getFirestore(app);

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
export default app;
