import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { finishGoogleRedirect, login, loginWithGoogle, logout, register, subscribeToAuth } from '../auth';

const resizePhoto = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const size = 320;
      const scale = Math.min(size / img.width, size / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Не вдалося обробити фото.'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = reject;
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

export const AuthPanel: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  const [savedNickname, setSavedNickname] = useState('');
  const [photo, setPhoto] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) { setSavedNickname(''); setNickname(''); setPhoto(''); return; }
      try {
        const profile = await getDoc(doc(db, 'users', currentUser.uid));
        const data = profile.exists() ? profile.data() : {};
        const name = String(data.nickname || '');
        setSavedNickname(name);
        setNickname(name || currentUser.displayName || '');
        setPhoto(String(data.photo || currentUser.photoURL || ''));
      } catch (err) { console.error('Не вдалося завантажити профіль:', err); }
    });
    finishGoogleRedirect().catch((err: any) => {
      if (err?.code && err.code !== 'auth/no-auth-event') setError(err?.message || 'Не вдалося завершити вхід через Google.');
    });
    return unsubscribe;
  }, []);

  const saveProfile = async () => {
    if (!user) return;
    const name = nickname.trim();
    if (name.length < 2 || name.length > 40) { setError('Імʼя має містити від 2 до 40 символів.'); return; }
    setBusy(true); setError('');
    try {
      await setDoc(doc(db, 'users', user.uid), { nickname: name, email: user.email || '', photo: photo || '', updatedAt: new Date().toISOString() }, { merge: true });
      setSavedNickname(name);
    } catch (err: any) { setError(err?.message || 'Не вдалося зберегти профіль.'); }
    finally { setBusy(false); }
  };

  const choosePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Оберіть файл зображення.'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('Фото має бути не більше 8 МБ.'); return; }
    setError(''); setBusy(true);
    try { setPhoto(await resizePhoto(file)); } catch { setError('Не вдалося обробити фото.'); }
    finally { setBusy(false); e.target.value = ''; }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { if (mode === 'login') await login(email, password); else await register(email, password); setEmail(''); setPassword(''); }
    catch (err: any) { setError(err?.message || 'Не вдалося виконати вхід.'); }
    finally { setBusy(false); }
  };

  const googleSignIn = async () => { setError(''); setBusy(true); try { await loginWithGoogle(); } catch (err: any) { setBusy(false); setError(err?.message || 'Не вдалося увійти через Google.'); } };

  if (user) return (
    <div className="bg-slate-900/95 p-5 rounded-3xl border border-cyan-900/50 space-y-4 shadow-2xl">
      <div className="text-center">
        <div className="mx-auto relative h-24 w-24 overflow-hidden rounded-full border-4 border-cyan-300/70 bg-slate-800 shadow-xl">
          {photo ? <img src={photo} alt="Фото профілю" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><span className="text-3xl">👤</span></div>}
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-extrabold text-cyan-200 hover:bg-white/10">
          📷 Додати фото
          <input type="file" accept="image/*" onChange={choosePhoto} className="hidden" />
        </label>
      </div>
      <div><div className="text-sm font-extrabold text-white">👤 Мій акаунт</div><div className="mt-1 text-[11px] text-purple-300/70 break-all">Google: {user.email || 'без email'}</div></div>
      <div><label className="block text-xs font-bold text-slate-200 mb-1.5">Імʼя профілю</label><input value={nickname} onChange={e => setNickname(e.target.value)} maxLength={40} placeholder="Наприклад: Назар" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-purple-900/50 text-white text-xs outline-none" /></div>
      <button disabled={busy || (nickname.trim() === savedNickname && !photo)} onClick={saveProfile} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl">{busy ? 'Зберігаємо…' : 'Зберегти профіль'}</button>
      {error && <div className="text-xs text-rose-300 break-words">{error}</div>}
      <div className="text-xs text-cyan-300 text-center">Профіль: {savedNickname || 'імʼя ще не задане'}</div>
      <button onClick={() => logout()} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-purple-800/40">Вийти</button>
    </div>
  );

  return (
    <div className="bg-slate-900/95 p-5 rounded-3xl border border-cyan-900/50 space-y-3 shadow-2xl">
      <div className="text-sm font-extrabold text-white">👤 Увійти в акаунт</div>
      <p className="text-xs text-purple-200/70">Увійдіть через Google або Email, щоб керувати власними оголошеннями.</p>
      <button type="button" disabled={busy} onClick={googleSignIn} className="w-full py-3 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-300"><span className="text-base font-black">G</span> {busy ? 'Переходимо до Google…' : 'Увійти через Google'}</button>
      <div className="flex items-center gap-2 text-[10px] text-slate-500"><span className="h-px flex-1 bg-slate-700" /><span>АБО EMAIL</span><span className="h-px flex-1 bg-slate-700" /></div>
      <form onSubmit={submit} className="space-y-2.5">
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-purple-900/50 text-white text-xs outline-none" />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={6} placeholder="Пароль (мінімум 6 символів)" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-purple-900/50 text-white text-xs outline-none" />
        {error && <div className="text-xs text-rose-300 break-words">{error}</div>}
        <button disabled={busy} type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl">{busy ? 'Зачекайте…' : mode === 'login' ? 'Увійти' : 'Створити акаунт'}</button>
      </form>
      <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-xs text-cyan-300 underline">{mode === 'login' ? 'Створити новий акаунт' : 'У мене вже є акаунт'}</button>
    </div>
  );
};