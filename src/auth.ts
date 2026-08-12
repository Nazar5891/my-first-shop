import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const register = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email.trim(), password);

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export const loginWithGoogle = async () => {
  await setPersistence(auth, browserLocalPersistence);
  try {
    // Primary flow: popup keeps the user on GitHub Pages and immediately returns the credential.
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    // If the mobile browser blocks the popup, use Firebase's redirect flow instead.
    const code = String(error?.code || '');
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
};

export const finishGoogleRedirect = () => getRedirectResult(auth);

export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);
