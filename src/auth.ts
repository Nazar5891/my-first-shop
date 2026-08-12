import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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

// Use Firebase redirect flow on GitHub Pages. It avoids popup blockers on Android.
export const loginWithGoogle = () => signInWithRedirect(auth, googleProvider);

export const finishGoogleRedirect = () => getRedirectResult(auth);

export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);
