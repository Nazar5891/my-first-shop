import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
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
// Після закінчення терміну воно не повинно залишатися в архіві.
// Фото та пов'язані коментарі також очищаються.
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
    // Якщо файл уже відсутній, очищення вважаємо успішним.
    if (error?.code === 'storage/object-not-found') return;
    throw error;
  }
};

const deleteListingComments = async (listingId: string) => {
  const commentsSnapshot = await getDocs(
    query(collection(db, 'comments'), where('listingId', '==', listingId))
  );

  await Promise.all(
    commentsSnapshot.docs.map(commentDoc => deleteDoc(commentDoc.ref))
  );
};

const cleanupExpiredListings = async () => {
  try {
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const legacyCutoffIso = new Date(now - LISTING_LIFETIME_MS).toISOString();

    // Не читаємо всю колекцію щогодини: шукаємо лише потенційно прострочені записи.
    const [expiringSnapshot, legacySnapshot] = await Promise.all([
      getDocs(query(collection(db, 'listings'), where('expiresAt', '<=', nowIso))),
      getDocs(query(collection(db, 'listings'), where('createdAt', '<=', legacyCutoffIso))),
    ]);

    const uniqueDocs = new Map<string, typeof expiringSnapshot.docs[number]>();
    [...expiringSnapshot.docs, ...legacySnapshot.docs].forEach(listingDoc => {
      uniqueDocs.set(listingDoc.id, listingDoc);
    });

    await Promise.all(Array.from(uniqueDocs.values()).map(async listingDoc => {
      const data = listingDoc.data() as Record<string, unknown>;
      const expiryMs = getExpiryMs(data);
      if (!Number.isFinite(expiryMs) || expiryMs > now) return;

      const photoUrl = typeof data.photoUrl === 'string' ? data.photoUrl : '';

      try {
        // Спочатку очищаємо фото та коментарі.
        // Якщо очищення Storage не вдалося, саме оголошення не видаляємо:
        // наступна перевірка спробує ще раз.
        await deleteListingPhoto(photoUrl);
        await deleteListingComments(listingDoc.id);
        await deleteDoc(listingDoc.ref);
        console.info('Прострочене оголошення, фото та коментарі очищено:', listingDoc.id);
      } catch (error) {
        console.error(
          'Очищення простроченого оголошення не завершено; повторимо пізніше:',
          listingDoc.id,
          error
        );
      }
    }));
  } catch (error) {
    console.error('Помилка автоматичного очищення оголошень:', error);
  }
};

// На Spark очищення виконується під час роботи сайту.
// Перевірка одразу після запуску та раз на годину.
void cleanupExpiredListings();
setInterval(() => {
  void cleanupExpiredListings();
}, 60 * 60 * 1000);
