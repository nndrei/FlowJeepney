import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, rtdb } from './firebase';
import { AuthUser } from '../types/auth';
import { PRECONFIGURED_ACCOUNTS } from './seedUsers';

const withTimeout = <T>(promise: Promise<T>, ms = 2000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
};

/**
 * Authenticates user with Firebase Auth and resolves profile/role metadata from Firebase Realtime Database (/users/{uid}).
 */
export async function loginWithCredentials(
  emailInput: string,
  passwordInput: string
): Promise<AuthUser> {
  const email = emailInput.trim();
  const password = passwordInput;

  // 1. Check if this is one of the pre-configured test accounts
  const matchedAccount = PRECONFIGURED_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );

  if (matchedAccount) {
    // Validate password for preconfigured test account
    if (password !== matchedAccount.password) {
      const err = new Error('auth/wrong-password');
      (err as any).code = 'auth/wrong-password';
      throw err;
    }

    const uid = `uid-${matchedAccount.profile.role}-${matchedAccount.email.replace(/[^a-zA-Z0-9]/g, '')}`;

    const resolvedUser: AuthUser = {
      uid,
      name: matchedAccount.profile.name,
      email: matchedAccount.email,
      role: matchedAccount.profile.role,
      operatorId: matchedAccount.profile.operatorId,
      assignedRouteId: matchedAccount.profile.assignedRouteId,
      assignedPlate: matchedAccount.profile.assignedPlate,
      cooperative: matchedAccount.profile.cooperative,
    };

    // Cache locally immediately so session is responsive
    try {
      localStorage.setItem('flowjeep_user', JSON.stringify(resolvedUser));
    } catch {
      // ignore
    }

    // Attempt Firebase sync non-blockingly with strict timeout
    (async () => {
      try {
        let authUid = uid;
        try {
          const cred = await withTimeout(
            signInWithEmailAndPassword(auth, email, password),
            1200
          );
          authUid = cred.user.uid;
        } catch {
          try {
            const newCred = await withTimeout(
              createUserWithEmailAndPassword(auth, email, password),
              1200
            );
            authUid = newCred.user.uid;
          } catch {
            // ignore
          }
        }

        const userRef = ref(rtdb, `users/${authUid}`);
        const snap = await withTimeout(get(userRef), 1000);
        if (!snap.exists()) {
          await withTimeout(
            set(userRef, {
              uid: authUid,
              ...matchedAccount.profile,
            }),
            1000
          );
        }
      } catch {
        // non-blocking
      }
    })();

    return resolvedUser;
  }

  // 2. Standard Firebase Auth for any other credentials
  try {
    const userCredential = await withTimeout(
      signInWithEmailAndPassword(auth, email, password),
      2500
    );
    const user = userCredential.user;

    let resolvedUser: AuthUser = {
      uid: user.uid,
      name: user.displayName || email.split('@')[0] || 'Commuter',
      email: user.email || email,
      role: 'commuter',
    };

    try {
      const userRef = ref(rtdb, `users/${user.uid}`);
      const snapshot = await withTimeout(get(userRef), 1200);
      if (snapshot.exists()) {
        const val = snapshot.val();
        resolvedUser = {
          uid: user.uid,
          name: val.name || resolvedUser.name,
          email: val.email || resolvedUser.email,
          role: val.role === 'operator' ? 'operator' : 'commuter',
          operatorId: val.operatorId,
          assignedRouteId: val.assignedRouteId,
          assignedPlate: val.assignedPlate,
          cooperative: val.cooperative,
        };
      }
    } catch {
      // fallback to default commuter record
    }

    try {
      localStorage.setItem('flowjeep_user', JSON.stringify(resolvedUser));
    } catch {
      // ignore
    }

    return resolvedUser;
  } catch (err: any) {
    throw err;
  }
}

/**
 * Signs out current user from Firebase Auth and clears local storage session cache.
 */
export async function logoutUser(): Promise<void> {
  try {
    await withTimeout(signOut(auth), 800);
  } catch {
    // ignore
  } finally {
    try {
      localStorage.removeItem('flowjeep_user');
      localStorage.removeItem('flowjeep_active_ping');
    } catch {
      // ignore
    }
  }
}
