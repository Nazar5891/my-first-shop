import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { login, loginWithGoogle, logout, register, subscribeToAuth } from '../auth';

export const AuthPanel: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeToAuth(setUser), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err?.message || 'Не вдалося виконати вхід.');
    } finally {
      setBusy(false);
    }
  };

  const googleSignIn = async () => {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Не вдалося увійти через Google.');
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-purple-900/40 space-y-3 shadow-xl">
        <div className="text-sm font-extrabold text-white">👤 Мій акаунт</div>
        <div className="text-xs text-purple-200/80 break-all">{user.displayName || user.email}</div>
        <button onClick={() => logout()} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-purple-800/40">Вийти</button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 p-5 rounded-3xl border border-purple-900/40 space-y-3 shadow-xl">
      <div className="text-sm font-extrabold text-white">👤 Увійти в акаунт</div>
      <p className="text-xs text-purple-200/70">Увійдіть через Google або Email, щоб керувати власними оголошеннями.</p>
      <button type="button" disabled={busy} onClick={googleSignIn} className="w-full py-3 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-300">
        <span className="text-base font-black">G</span> Увійти через Google
      </button>
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
