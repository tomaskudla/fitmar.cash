'use client';

import { useState, useEffect } from 'react';
import FitMarCalc from './calculator';

export default function HomePage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('fitmar-pw');
    if (saved) {
      verify(saved);
    } else {
      setLoading(false);
    }
  }, []);

  async function verify(pw: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/storage/auth-check', {
        headers: { 'x-app-password': pw },
      });
      if (res.ok) {
        sessionStorage.setItem('fitmar-pw', pw);
        setAuthed(true);
      } else {
        setError('Špatné heslo');
        sessionStorage.removeItem('fitmar-pw');
      }
    } catch (e) {
      setError('Chyba spojení');
    }
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    verify(password);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF7F2' }}>
        <p className="text-stone-500 text-sm">Načítám…</p>
      </div>
    );
  }

  if (authed) return <FitMarCalc />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#FAF7F2' }}>
      <form onSubmit={handleSubmit} className="bg-white border border-stone-300 p-8 max-w-sm w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-2">FitMar</p>
        <h1 className="text-2xl mb-6" style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
          Cash Flow Kalkulačka
        </h1>
        <label className="block mb-4">
          <span className="text-xs text-stone-600 block mb-1">Heslo</span>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 focus:border-stone-900 focus:outline-none bg-stone-50"
          />
        </label>
        {error && <p className="text-rose-600 text-xs mb-3">{error}</p>}
        <button type="submit" className="w-full bg-stone-900 text-stone-50 py-2 text-sm uppercase tracking-wider hover:bg-stone-700 transition">
          Vstoupit
        </button>
      </form>
    </div>
  );
}
