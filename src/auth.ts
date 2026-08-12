import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
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

// Popup works directly on GitHub Pages and avoids redirect-return problems on mobile.
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

// Kept for compatibility with an already-started redirect flow.
export const loginWithGoogleRedirect = () => signInWithRedirect(auth, googleProvider);

export const finishGoogleRedirect = () => getRedirectResult(auth);

export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);
