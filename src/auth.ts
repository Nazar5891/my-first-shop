import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  return signInWithPopup(auth, googleProvider);
};

export const finishGoogleRedirect = async () => null;

export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);
