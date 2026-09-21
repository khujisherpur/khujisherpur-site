'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import LanguageToggle from '../../components/LanguageToggle';

function getCookieLang() {
  if (typeof document === 'undefined') return 'bn';
  const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
  return match && match[1] === 'en' ? 'en' : 'bn';
}

const text = {
  bn: {
    login: 'লগইন', signup: 'সাইনআপ', google: 'Google দিয়ে চালিয়ে যান', or: 'অথবা',
    name: 'নাম', namePh: 'আপনার নাম', email: 'ইমেইল', password: 'পাসওয়ার্ড', passwordPh: 'কমপক্ষে ৬ অক্ষর',
    loginBtn: 'লগইন করুন', signupBtn: 'অ্যাকাউন্ট তৈরি করুন', waiting: 'অপেক্ষা করুন...',
    signupSuccess: 'অ্যাকাউন্ট তৈরি হয়েছে! ইমেইলে পাঠানো কনফার্মেশন লিংকে ক্লিক করে ভেরিফাই করুন।',
    termsLine1: 'সাইনআপ করলে আপনি আমাদের', terms: 'শর্তাবলি', and: ' ও ', privacy: 'প্রাইভেসি পলিসি', termsLine2: ' মেনে নিচ্ছেন।',
  },
  en: {
    login: 'Login', signup: 'Sign Up', google: 'Continue with Google', or: 'or',
    name: 'Name', namePh: 'Your name', email: 'Email', password: 'Password', passwordPh: 'At least 6 characters',
    loginBtn: 'Log In', signupBtn: 'Create Account', waiting: 'Please wait...',
    signupSuccess: 'Account created! Please check your email and click the confirmation link.',
    termsLine1: 'By signing up, you agree to our', terms: 'Terms', and: ' and ', privacy: 'Privacy Policy', termsLine2: '.',
  },
};

export default function LoginPage() {
  const [lang, setLang] = useState('bn');
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLang(getCookieLang());
  }, []);

  const t = text[lang];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage(t.signupSuccess);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = '/dashboard';
      }
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <div className="flex justify-center mb-4">
        <LanguageToggle lang={lang} />
      </div>
      <a href="/" className="flex justify-center mb-8">
        <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-12 w-auto" />
      </a>

      <div className="bg-white border-2 border-ink/10 p-6">
        <div className="flex mb-6 border-b border-ink/10">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 pb-3 text-sm font-semibold ${mode === 'login' ? 'text-green border-b-2 border-green' : 'text-ink/50'}`}
          >
            {t.login}
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 pb-3 text-sm font-semibold ${mode === 'signup' ? 'text-green border-b-2 border-green' : 'text-ink/50'}`}
          >
            {t.signup}
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-ink/20 py-2.5 hover:bg-paper transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.88 2.69-6.64z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.96H.96A8.996 8.996 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.99 2.34C4.66 5.16 6.65 3.58 9 3.58z"/>
          </svg>
          <span className="text-sm font-medium">{t.google}</span>
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-ink/10" />
          <span className="text-xs text-ink/40">{t.or}</span>
          <div className="flex-1 h-px bg-ink/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm mb-1.5 text-ink/70">{t.name}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
                placeholder={t.namePh}
              />
            </div>
          )}
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">{t.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink/70">{t.password}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green"
              placeholder={t.passwordPh}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-marigold text-ink font-semibold py-2.5 hover:bg-marigold/90 transition-colors disabled:opacity-50"
          >
            {loading ? t.waiting : mode === 'login' ? t.loginBtn : t.signupBtn}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-ink/50 mt-6">
        {t.termsLine1}{' '}
        <a href="/terms" className="underline">{t.terms}</a>{t.and}
        <a href="/privacy" className="underline">{t.privacy}</a>{t.termsLine2}
      </p>
    </main>
  );
}
