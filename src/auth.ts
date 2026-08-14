import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
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

// Гостьовий режим: користувач може зайти на сайт без реєстрації.
export const loginAnonymously = async () => {
  await setPersistence(auth, browserLocalPersistence);
  return signInAnonymously(auth);
};

export const finishGoogleRedirect = async () => null;

export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  const unsubscribe = onAuthStateChanged(auth, async user => {
    if (user) {
      callback(user);
      return;
    }
    try {
      const result = await loginAnonymously();
      callback(result.user);
    } catch (error) {
      console.error('Не вдалося увімкнути гостьовий режим:', error);
      callback(null);
    }
  });
  return unsubscribe;
};
