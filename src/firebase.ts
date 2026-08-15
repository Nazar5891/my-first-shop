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

// Правило «Майстра»: оголошення зберігається 7 днів.
// Після закінчення терміну воно не повинно залишатися ні в архіві,
// ні в локальному стані застосунку. Фото видаляємо зі Storage перед
// видаленням документа, щоб не залишати файл-сироту.
const LISTING_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

const getExpiryMs = (data: Record<string, unknown>) => {
  if (typeof data.expiresAt === 'string') {
    const value = Date.parse(data.expiresAt);
    if (Number.isFinite(value)) return value;
  }

  // Сумісність зі старими оголошеннями, де ще немає expiresAt.
  if (typeof data.createdAt === 'string') {
    const created = Date.parse(data.createdAt);
    if (Number.isFinite(created)) return created + LISTING_LIFETIME_MS;
  }

  return NaN;
};

const deleteListingPhoto = async (photoUrl: string) => {
  if (!photoUrl) return;
  try {
    await deleteObject(ref(storage, photoUrl));
  } catch (error: any) {
    // Якщо файл уже відсутній, це теж успішне очищення.
    if (error?.code === 'storage/object-not-found') return;
    throw error;
  }
};

const cleanupExpiredListings = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'listings'));
    const now = Date.now();

    await Promise.all(snapshot.docs.map(async listingDoc => {
      const data = listingDoc.data() as Record<string, unknown>;
      const expiryMs = getExpiryMs(data);
      if (!Number.isFinite(expiryMs) || expiryMs > now) return;

      const photoUrl = typeof data.photoUrl === 'string' ? data.photoUrl : '';

      try {
        // Спочатку видаляємо фото. Якщо Storage тимчасово недоступний,
        // документ залишається і наступна погодинна перевірка спробує знову.
        await deleteListingPhoto(photoUrl);
        await deleteDoc(doc(db, 'listings', listingDoc.id));
        console.info('Прострочене оголошення та його фото очищено:', listingDoc.id);
      } catch (error) {
        console.error('Очищення простроченого оголошення не завершено; повторимо пізніше:', listingDoc.id, error);
      }
    }));
  } catch (error) {
    console.error('Помилка автоматичного очищення оголошень:', error);
  }
};

// Перевірка одразу після запуску та щогодини, поки сайт відкритий.
void cleanupExpiredListings();
setInterval(() => { void cleanupExpiredListings(); }, 60 * 60 * 1000);
