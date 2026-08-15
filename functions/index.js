const { onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

initializeApp();

function storagePathFromUrl(photoUrl, bucketName) {
  if (typeof photoUrl !== 'string' || !photoUrl) return null;

  try {
    const url = new URL(photoUrl);
    const pathname = decodeURIComponent(url.pathname);

    // Firebase download URL: /v0/b/<bucket>/o/<encoded-object-path>
    const match = pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
    if (match) {
      const bucket = decodeURIComponent(match[1]);
      if (!bucketName || bucket === bucketName) return match[2];
    }

    // Google Cloud Storage URL: /<bucket>/<object-path>
    if (url.hostname === 'storage.googleapis.com') {
      const parts = pathname.replace(/^\/+/, '').split('/');
      if (parts.length >= 2) {
        const bucket = parts.shift();
        if (!bucketName || bucket === bucketName) return parts.join('/');
      }
    }
  } catch (error) {
    console.warn('Не вдалося розібрати URL фото:', error);
  }

  return null;
}

exports.deleteListingPhoto = onDocumentDeleted('listings/{listingId}', async (event) => {
  const data = event.data?.data();
  const photoUrl = data?.photoUrl;
  if (typeof photoUrl !== 'string' || !photoUrl) return;

  const bucket = getStorage().bucket();
  const path = storagePathFromUrl(photoUrl, bucket.name);
  if (!path) {
    console.warn('Фото оголошення не є файлом цього Firebase Storage bucket:', event.params.listingId);
    return;
  }

  try {
    await bucket.file(path).delete({ ignoreNotFound: true });
    console.log(`Фото видалено для оголошення ${event.params.listingId}: ${path}`);
  } catch (error) {
    console.error(`Не вдалося видалити фото оголошення ${event.params.listingId}:`, error);
    throw error;
  }
});
