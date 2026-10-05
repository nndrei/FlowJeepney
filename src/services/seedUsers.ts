import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, rtdb } from './firebase';
import { AuthUser } from '../types/auth';

export interface PreconfiguredAccount {
  email: string;
  password: string;
  profile: Omit<AuthUser, 'uid'> & { createdAt: number };
}

export const PRECONFIGURED_ACCOUNTS: PreconfiguredAccount[] = [
  {
    email: 'commuter@flowjeep.ph',
    password: 'CommuterPass123!',
    profile: {
      name: 'Juan Dela Cruz',
      email: 'commuter@flowjeep.ph',
      role: 'commuter',
      createdAt: 1775088000000,
    },
  },
  {
    email: 'operator@flowjeep.com',
    password: 'OperatorPass123!',
    profile: {
      name: 'MAVANODA Dispatcher',
      email: 'operator@flowjeep.com',
      role: 'operator',
      operatorId: 'OP-MAVANODA-01',
      assignedRouteId: 'route-malinta-novaliches',
      assignedPlate: 'NDL-8421',
      cooperative: 'MAVANODA Transport Cooperative',
      createdAt: 1775088000000,
    },
  },
];

const withTimeout = <T>(promise: Promise<T>, ms = 1200): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
};

/**
 * Ensures pre-configured test accounts exist in Firebase Authentication
 * and their corresponding /users/{uid} records are populated in Realtime Database.
 */
export async function seedTestUsers(): Promise<void> {
  for (const account of PRECONFIGURED_ACCOUNTS) {
    try {
      let uid: string | null = null;
      try {
        const userCred = await withTimeout(
          createUserWithEmailAndPassword(auth, account.email, account.password)
        );
        uid = userCred.user.uid;
      } catch (authErr: any) {
        if (authErr?.code === 'auth/email-already-in-use') {
          try {
            const signedIn = await withTimeout(
              signInWithEmailAndPassword(auth, account.email, account.password)
            );
            uid = signedIn.user.uid;
          } catch {
            // ignore
          }
        }
      }

      if (uid) {
        const userRef = ref(rtdb, `users/${uid}`);
        try {
          const snapshot = await withTimeout(get(userRef));
          if (!snapshot.exists()) {
            await withTimeout(
              set(userRef, {
                uid,
                ...account.profile,
              })
            );
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // never crash the app
    }
  }
}
