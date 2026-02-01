import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK with Realtime Database
let db = null;
let isFirebaseInitialized = false;

try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.asia-southeast1.firebasedatabase.app`,
        });
        db = admin.database();
        isFirebaseInitialized = true;
        console.log('✅ Firebase Realtime Database initialized');
    } else {
        console.log('⚠️ Firebase credentials not found. Using in-memory store for development.');
    }
} catch (error) {
    console.error('Firebase initialization error:', error.message);
}

// In-memory store for development (when Firebase is not configured)
const memoryStore = {
    users: new Map(),
    interviews: new Map(),
    responses: new Map(),
    performanceMetrics: new Map(),
};

export { db, admin, isFirebaseInitialized, memoryStore };
