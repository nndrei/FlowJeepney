import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, rtdb } from './firebase';
import { AuthUser } from '../types/auth';
import { PRECONFIGURED_ACCOUNTS } from './seedUsers';

const withTimeout = <T>(promise: Promise<T>, ms = 8000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
};

/**
 * Creates a new user profile in RTDB.
 */
export async function signUpWithCredentials(
  emailInput: string,
  passwordInput: string,
  fullName?: string
): Promise<AuthUser> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  if (password.length < 6) {
    const err: any = new Error('Password must be at least 6 characters');
    err.code = 'auth/weak-password';
    throw err;
  }

  // Check preconfigured accounts
  if (PRECONFIGURED_ACCOUNTS.some((a) => a.email.toLowerCase() === email)) {
    const err: any = new Error('Email already registered');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  // Check RTDB for existing user
  const uid = `uid-commuter-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
  const userRef = ref(rtdb, `users/${uid}`);

  try {
    const existingSnap = await withTimeout(get(userRef), 2000);
    if (existingSnap.exists()) {
      const err: any = new Error('Email already registered');
      err.code = 'auth/email-already-in-use';
      throw err;
    }
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') throw err;
    // ignore network read errors and proceed
  }

  const name = fullName?.trim() || email.split('@')[0] || 'Commuter';
  const newRecord = {
    uid,
    name,
    email,
    password,
    role: 'commuter' as const,
    createdAt: Date.now(),
  };

  await withTimeout(set(userRef, newRecord), 4000);

  const resolvedUser: AuthUser = {
    uid,
    name,
    email,
    role: 'commuter',
  };

  try {
    localStorage.setItem('flowjeep_user', JSON.stringify(resolvedUser));
  } catch {
    // ignore
  }

  return resolvedUser;
}

/**
 * Authenticates user credentials.
 * Resilient implementation: validates preconfigured system accounts (Admin, Driver, Commuter)
 * and registered database accounts directly, ensuring immunity to external Identity Toolkit API restrictions.
 */
export async function loginWithCredentials(
  emailInput: string,
  passwordInput: string
): Promise<AuthUser> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  // 1. Check if this is one of the pre-configured system accounts
  const matchedAccount = PRECONFIGURED_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email
  );

  if (matchedAccount) {
    if (password !== matchedAccount.password) {
      const err: any = new Error('Invalid email or password');
      err.code = 'auth/wrong-password';
      throw err;
    }

    const uid =
      matchedAccount.email === 'operator@flowjeep.com'
        ? 'uid-operator-mavanoda-01'
        : `uid-${matchedAccount.profile.role}-${matchedAccount.email.replace(/[^a-zA-Z0-9]/g, '')}`;

    let resolvedUser: AuthUser = {
      uid,
      name: matchedAccount.profile.name,
      email: matchedAccount.email,
      role: matchedAccount.profile.role,
      driverId: (matchedAccount.profile as any).driverId || (matchedAccount.profile as any).operatorId,
      operatorId: (matchedAccount.profile as any).operatorId,
      assignedRouteId: (matchedAccount.profile as any).assignedRouteId,
      assignedPlate: (matchedAccount.profile as any).assignedPlate,
      assignedJeepneyId: (matchedAccount.profile as any).assignedJeepneyId,
      cooperative: matchedAccount.profile.cooperative,
      licenseNumber: (matchedAccount.profile as any).licenseNumber,
      phone: (matchedAccount.profile as any).phone,
    };

    // Sync / fetch live assignments from RTDB
    try {
      const userRef = ref(rtdb, `users/${uid}`);
      const snap = await withTimeout(get(userRef), 2000);
      if (snap.exists()) {
        const val = snap.val();
        resolvedUser = {
          ...resolvedUser,
          name: val.name || resolvedUser.name,
          role:
            val.role === 'admin'
              ? 'admin'
              : val.role === 'driver' || val.role === 'operator'
              ? 'driver'
              : 'commuter',
          assignedJeepneyId: val.assignedJeepneyId || resolvedUser.assignedJeepneyId,
          assignedPlate: val.assignedPlate || resolvedUser.assignedPlate,
          assignedRouteId: val.assignedRouteId || resolvedUser.assignedRouteId,
          phone: val.phone || resolvedUser.phone,
          licenseNumber: val.licenseNumber || resolvedUser.licenseNumber,
          driverId: val.driverId || val.operatorId || resolvedUser.driverId,
        };
      } else {
        await withTimeout(
          set(userRef, {
            uid,
            ...matchedAccount.profile,
          }),
          2000
        );
      }
    } catch {
      // offline / timeout fallback
    }

    // Dynamic vehicle assignment check for driver if not explicitly linked
    if (resolvedUser.role === 'driver' && !resolvedUser.assignedJeepneyId) {
      try {
        const jeepSnap = await withTimeout(get(ref(rtdb, 'jeepneys')), 1500);
        if (jeepSnap.exists()) {
          const allJeeps = jeepSnap.val();
          for (const jId of Object.keys(allJeeps)) {
            if (
              allJeeps[jId]?.currentDriverUid === uid ||
              allJeeps[jId]?.operatorId === 'OP-MAVANODA-01'
            ) {
              resolvedUser.assignedJeepneyId = jId;
              resolvedUser.assignedPlate = allJeeps[jId]?.plateNumber || resolvedUser.assignedPlate;
              resolvedUser.assignedRouteId = allJeeps[jId]?.assignedRouteId || resolvedUser.assignedRouteId;
              break;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    try {
      localStorage.setItem('flowjeep_user', JSON.stringify(resolvedUser));
    } catch {
      // ignore
    }

    return resolvedUser;
  }

  // 2. Check registered accounts in RTDB (/users)
  try {
    const usersSnap = await withTimeout(get(ref(rtdb, 'users')), 3000);
    if (usersSnap.exists()) {
      const allUsers = usersSnap.val();
      for (const k of Object.keys(allUsers)) {
        const u = allUsers[k];
        if (u?.email && u.email.toLowerCase() === email) {
          if (u.password && u.password !== password) {
            const err: any = new Error('Invalid email or password');
            err.code = 'auth/wrong-password';
            throw err;
          }

          let userRole: AuthUser['role'] = 'commuter';
          if (u.role === 'admin') userRole = 'admin';
          else if (u.role === 'driver' || u.role === 'operator') userRole = 'driver';

          const resolvedUser: AuthUser = {
            uid: u.uid || k,
            name: u.name || email,
            email: u.email,
            role: userRole,
            driverId: u.driverId || u.operatorId,
            operatorId: u.operatorId,
            assignedJeepneyId: u.assignedJeepneyId,
            assignedPlate: u.assignedPlate,
            assignedRouteId: u.assignedRouteId,
            cooperative: u.cooperative,
            licenseNumber: u.licenseNumber,
            phone: u.phone,
          };

          try {
            localStorage.setItem('flowjeep_user', JSON.stringify(resolvedUser));
          } catch {
            // ignore
          }

          return resolvedUser;
        }
      }
    }
  } catch (dbErr: any) {
    if (dbErr?.code === 'auth/wrong-password') throw dbErr;
  }

  // 3. User not found
  const notFoundErr: any = new Error('Invalid email or password');
  notFoundErr.code = 'auth/invalid-credential';
  throw notFoundErr;
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

/**
 * Authenticates user with Google via Firebase Auth popup and resolves profile/role from RTDB.
 * Keeps data email-only (no photoURL or Google display name stored).
 */
export async function loginWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const email = user.email || '';

  let resolvedUser: AuthUser = {
    uid: user.uid,
    name: email,
    email: email,
    role: 'commuter',
  };

  try {
    const userRef = ref(rtdb, `users/${user.uid}`);
    const snapshot = await withTimeout(get(userRef), 2000);

    if (snapshot.exists()) {
      const val = snapshot.val();
      let userRole: AuthUser['role'] = 'commuter';
      if (val.role === 'admin') {
        userRole = 'admin';
      } else if (val.role === 'driver' || val.role === 'operator') {
        userRole = 'driver';
      }

      resolvedUser = {
        uid: user.uid,
        name: val.name || email,
        email: val.email || email,
        role: userRole,
        driverId: val.driverId || val.operatorId,
        operatorId: val.operatorId,
        assignedJeepneyId: val.assignedJeepneyId,
        assignedRouteId: val.assignedRouteId,
        assignedPlate: val.assignedPlate,
        cooperative: val.cooperative,
        licenseNumber: val.licenseNumber,
        phone: val.phone,
      };
    } else {
      // Create initial commuter record with email only
      await withTimeout(
        set(userRef, {
          uid: user.uid,
          email: email,
          name: email,
          role: 'commuter',
          createdAt: Date.now(),
        }),
        2000
      );
    }
  } catch (dbErr) {
    console.warn('[authService] RTDB sync notice:', dbErr);
  }

  try {
    localStorage.setItem('flowjeep_user', JSON.stringify(resolvedUser));
  } catch {
    // ignore
  }

  return resolvedUser;
}

/**
 * Creates a lightweight client-side guest session without Firebase Auth or database storage.
 * Provides immediate access to passenger-facing transit features.
 */
export function createGuestSession(): AuthUser {
  const guestUser: AuthUser = {
    uid: 'guest',
    name: 'Guest Passenger',
    email: '',
    role: 'commuter',
    isGuest: true,
  };

  try {
    localStorage.setItem('flowjeep_user', JSON.stringify(guestUser));
  } catch {
    // ignore
  }

  return guestUser;
}
