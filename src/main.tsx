import React, { ErrorInfo, Suspense, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './hightech-collage.css';
import { CATEGORIES } from './types';
import { SUBCATEGORY_OVERRIDES } from './data/subcategories';

Object.entries(SUBCATEGORY_OVERRIDES).forEach(([categoryId, subcategories]) => {
  const category = CATEGORIES[categoryId as keyof typeof CATEGORIES];
  if (category && subcategories) category.subcategories = subcategories;
});

const LazyApp = React.lazy(() => import('./App.tsx'));

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Помилка запуску застосунку:', error, info); }
  render() {
    if (this.state.error) return <StartupError error={this.state.error} />;
    return this.props.children;
  }
}

function StartupError({ error }: { error: Error }) {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-lg w-full rounded-3xl border border-rose-500/30 bg-slate-900/90 p-6 shadow-2xl">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-black mb-2">Помічник не зміг запуститися</h1>
        <p className="text-slate-300 text-sm mb-5">GitHub Pages працює, але одна з частин програми викликала помилку під час запуску.</p>
        <button className="rounded-xl bg-purple-600 px-4 py-2 font-bold" onClick={() => window.location.reload()}>Спробувати ще раз</button>
        <button className="ml-2 rounded-xl bg-slate-700 px-4 py-2 font-bold" onClick={() => setShowDetails((v) => !v)}>{showDetails ? 'Сховати' : 'Показати помилку'}</button>
        {showDetails && <pre className="mt-5 whitespace-pre-wrap break-words rounded-xl bg-black/50 p-4 text-xs text-rose-200">{error?.stack || error?.message || String(error)}</pre>}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans"><div className="text-center"><div className="text-4xl mb-3">🌌</div><div className="font-bold">Завантаження Помічника…</div></div></div>;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <Suspense fallback={<LoadingScreen />}><LazyApp /></Suspense>
    </AppErrorBoundary>
  </React.StrictMode>,
);
