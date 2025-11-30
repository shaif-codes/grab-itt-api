import admin from 'firebase-admin';
import { CONSTANTS } from '../config/constants.js';
import { logger } from '../utils/index.js';
import fs from 'fs';
import path from 'path';

// Validate required Firebase environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
}

// Firebase Admin SDK configuration
const firebaseConfig = {
  project_id: CONSTANTS.firebaseConfig.projectId,
  private_key_id: CONSTANTS.firebaseAdmin.privateKeyId,
  private_key: formatPrivateKey(CONSTANTS.firebaseAdmin.privateKey),
  client_email: CONSTANTS.firebaseAdmin.clientEmail,
  client_id: CONSTANTS.firebaseAdmin.clientId,
  auth_uri: CONSTANTS.firebaseAdmin.authUri || 'https://accounts.google.com/o/oauth2/auth',
  token_uri: CONSTANTS.firebaseAdmin.tokenUri || 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: CONSTANTS.firebaseAdmin.authProviderX509CertUrl || 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: CONSTANTS.firebaseAdmin.clientX509CertUrl,
};

function formatPrivateKey(key: string | undefined): string | undefined {
  // Helper to validate key
  const isValidKey = (k: string) => k && k.includes('-----BEGIN PRIVATE KEY-----') && k.includes('-----END PRIVATE KEY-----');

  // If key is already valid (and likely loaded correctly via dotenv-cli or similar), just fix newlines
  if (key && isValidKey(key)) {
    if (key.includes('\\n')) return key.replace(/\\n/g, '\n');
    return key;
  }

  console.log('DEBUG: process.env.FIREBASE_PRIVATE_KEY is invalid or truncated. Attempting to read from .env file directly...');

  try {
    // Try to read .env file manually
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');

      // Look for the PEM block directly
      const match = envContent.match(/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/);
      if (match) {
        let extractedKey = match[0];
        console.log('DEBUG: Successfully extracted private key from .env file');

        // Handle escaped newlines if they exist in the file content
        if (extractedKey.includes('\\n')) {
          extractedKey = extractedKey.replace(/\\n/g, '\n');
        }
        return extractedKey;
      }
    }
  } catch (error) {
    console.error('DEBUG: Failed to read .env file manually:', error);
  }

  // Fallback to original logic if manual read fails (though it likely won't work if we are here)
  if (!key) {
    console.log('DEBUG: Private key is undefined');
    return undefined;
  }

  console.log('DEBUG: Private Key Analysis (fallback):');
  console.log(`- Length: ${key.length}`);
  console.log(`- Starts with quote: ${key.startsWith('"')}`);
  console.log(`- Ends with quote: ${key.endsWith('"')}`);
  console.log(`- Contains literal \\n: ${key.includes('\\n')}`);
  console.log(`- Contains actual newline: ${key.includes('\n')}`);
  console.log(`- First 10 chars: ${key.substring(0, 10)}`);
  console.log(`- Last 10 chars: ${key.substring(key.length - 10)}`);
  // ... existing cleanup logic ...
  if (key.includes('\\n')) {
    console.log('DEBUG: Replacing escaped newlines (fallback)');
    return key.replace(/\\n/g, '\n');
  }

  if (key.startsWith('"') && key.endsWith('"')) {
    console.log('DEBUG: Stripping quotes (fallback)');
    key = key.slice(1, -1);
    if (key.includes('\\n')) {
      console.log('DEBUG: Replacing escaped newlines after stripping quotes (fallback)');
      return key.replace(/\\n/g, '\n');
    }
  }

  return key;
}

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App;

try {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
      projectId: firebaseConfig.project_id,
    });

    logger.info('Firebase Admin SDK initialized successfully', {
      projectId: firebaseConfig.project_id
    });
  } else {
    firebaseApp = admin.app();
    logger.info('Firebase Admin SDK already initialized');
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin SDK', error as Error);
  throw new Error('Firebase initialization failed');
}

// Export Firebase Admin SDK instances
export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();

// Export the app instance
export { firebaseApp };

// Firebase configuration for client-side (if needed)
export const clientFirebaseConfig = {
  apiKey: CONSTANTS.firebaseConfig.apiKey,
  authDomain: CONSTANTS.firebaseConfig.authDomain,
  projectId: CONSTANTS.firebaseConfig.projectId,
  storageBucket: CONSTANTS.firebaseConfig.storageBucket,
  messagingSenderId: CONSTANTS.firebaseConfig.messagingSenderId,
  appId: CONSTANTS.firebaseConfig.appId,
  measurementId: CONSTANTS.firebaseConfig.measurementId,
};

// Utility functions
export class FirebaseService {
  /**
   * Verify Google ID token
   */
  static async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      logger.debug('Google ID token verified successfully', {
        uid: decodedToken.uid,
        email: decodedToken.email
      });
      return decodedToken;
    } catch (error) {
      logger.error('Failed to verify Google ID token', error as Error);
      throw new Error('Invalid Google ID token');
    }
  }

  /**
   * Get user by Firebase UID
   */
  static async getUserByUid(uid: string): Promise<admin.auth.UserRecord | null> {
    try {
      const userRecord = await auth.getUser(uid);
      return userRecord;
    } catch (error) {
      logger.error('Failed to get user by UID', error as Error, { uid });
      return null;
    }
  }

  /**
   * Create custom token for user
   */
  static async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    try {
      const customToken = await auth.createCustomToken(uid, additionalClaims);
      logger.debug('Custom token created successfully', { uid });
      return customToken;
    } catch (error) {
      logger.error('Failed to create custom token', error as Error, { uid });
      throw new Error('Failed to create custom token');
    }
  }

  /**
   * Delete user by Firebase UID
   */
  static async deleteUser(uid: string): Promise<void> {
    try {
      await auth.deleteUser(uid);
      logger.info('User deleted successfully', { uid });
    } catch (error) {
      logger.error('Failed to delete user', error as Error, { uid });
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Check if Firebase is properly configured
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // Try to list users to verify connection
      await auth.listUsers(1);
      return true;
    } catch (error) {
      logger.error('Firebase health check failed', error as Error);
      return false;
    }
  }
}

export default FirebaseService;
