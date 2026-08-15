import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDFhw3i0Xa6_UeN7fjSMAHxS7kcfbQbuMo',
  authDomain: 'rokitne--yahmyrov.firebaseapp.com',
  projectId: 'rokitne--yahmyrov',
  storageBucket: 'rokitne--yahmyrov.firebasestorage.app',
  messagingSenderId: '582905785754',
  appId: '1:582905785754:web:a76b3d35c704aa5e125e23',
  measurementId: 'G-BQ5B18N7T2'
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

// Тимчасове автоматичне очищення: оголошення живе 7 днів.
// Очищення запускається при відкритті сайту та повторюється щогодини,
// поки сайт відкритий. Фото оголошення також видаляється зі Storage.
const LISTING_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

const cleanupExpiredListings = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'listings'));
    const now = Date.now();

    await Promise.all(snapshot.docs.map(async listingDoc => {
      const data = listingDoc.data();
      const createdAt = typeof data.createdAt === 'string' ? Date.parse(data.createdAt) : NaN;
      if (!Number.isFinite(createdAt) || now - createdAt < LISTING_LIFETIME_MS) return;

      const photoUrl = typeof data.photoUrl === 'string' ? data.photoUrl : '';

      try {
        await deleteDoc(doc(db, 'listings', listingDoc.id));
      } catch (error) {
        console.error('Не вдалося видалити прострочене оголошення:', listingDoc.id, error);
        return;
      }

      if (photoUrl) {
        try {
          await deleteObject(ref(storage, photoUrl));
        } catch (error) {
          // Фото могло бути вже видалене або URL міг бути недійсним.
          console.warn('Не вдалося видалити фото простроченого оголошення:', error);
        }
      }
    }));
  } catch (error) {
    console.error('Помилка автоматичного очищення оголошень:', error);
  }
};

void cleanupExpiredListings();
setInterval(() => { void cleanupExpiredListings(); }, 60 * 60 * 1000);
