'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// লগইনের পর ফেরার ঠিকানা (?next=): শুধু সাইটের ভেতরের পাথ চলবে, বাইরের লিংকে পাঠানো যাবে না
function getNextPath() {
  if (typeof window === 'undefined') return '/dashboard';
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next || next.length > 300) return '/dashboard';
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/dashboard';
  if (/[\u0000-\u001f]/.test(next)) return '/dashboard';
  if (next.startsWith('/login')) return '/dashboard';
  return next;
}

const RESEND_SECONDS = 60;
const CODE_LENGTH = 6;

// এই পাতা এখন শুধু ইংরেজিতে
const t = {
  login: 'Log in', signup: 'Sign up', google: 'Log in with Google', or: 'or',
  name: 'Name', namePh: 'Your name', email: 'Email', password: 'Password', passwordPh: 'At least 6 characters',
  newPassword: 'New password',
  loginBtn: 'Log in', signupBtn: 'Create account', waiting: 'Please wait...',
  resetBtn: 'Send reset link', saveBtn: 'Update password',
  forgot: 'Forgot password?', backToLogin: '← Back to log in',
  forgotTitle: 'Reset password', forgotHelp: "Enter your email and we'll send you a reset link.",
  recoveryTitle: 'Set a new password',
  tagline: 'Everything in Sherpur, in one place',
  show: 'Show', hide: 'Hide',
  resetSent: 'Reset link sent. Please check your inbox (and spam folder).',
  passwordUpdated: 'Password updated. Redirecting...',
  termsLine1: 'By signing up, you agree to our', terms: 'Terms', and: ' and ', privacy: 'Privacy Policy', termsLine2: '.',
  verifyTitle: 'Verify your email',
  verifyIntro: 'Enter the 6-digit code we sent to',
  codePh: '000000',
  verifyBtn: 'Verify and create account',
  verifying: 'Verifying...',
  verifyHint: "Can't find it? Check your spam folder. The code can take a minute to arrive.",
  resend: 'Resend code',
  resent: 'A new code has been sent.',
  wrongEmail: 'Wrong email? Go back',
  errors: [
    ['invalid login credentials', 'Wrong email or password'],
    ['email not confirmed', 'Your email is not verified yet.'],
    ['already registered', 'An account with this email already exists. Please log in.'],
    ['token has expired', 'That code is incorrect or has expired. Try again or request a new code.'],
    ['otp', 'That code is incorrect or has expired. Try again or request a new code.'],
    ['at least', 'Password must be at least 6 characters'],
    ['same password', 'New password must be different from the old one'],
    ['rate limit', 'Too many attempts. Please try again in a little while.'],
    ['too many', 'Too many attempts. Please try again in a little while.'],
  ],
  errorFallback: 'Something went wrong. Please try again.',
};

function HillsBackground() {
  return (
    <>
      <style>{`
        @keyframes drift { from { transform: translateX(-50px); } to { transform: translateX(50px); } }
        .cloud-a { animation: drift 20s ease-in-out infinite alternate; }
        .cloud-b { animation: drift 28s ease-in-out infinite alternate-reverse; }
      `}</style>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E3A72E" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#E3A72E" stopOpacity="0" />
          </radialGradient>
          <g id="sal">
            <rect x="-1.2" y="0" width="2.4" height="12" />
            <path d="M0 -30 C9 -20 10 -6 0 4 C-10 -6 -9 -20 0 -30Z" />
          </g>
        </defs>

        {/* ভোরের সূর্য */}
        <circle cx="305" cy="470" r="120" fill="url(#sunGlow)" />
        <circle cx="305" cy="470" r="34" fill="#F6D27A" />

        {/* মেঘ */}
        <g className="cloud-a" fill="#fff" opacity="0.22">
          <ellipse cx="90" cy="150" rx="46" ry="12" />
          <ellipse cx="120" cy="140" rx="28" ry="11" />
        </g>
        <g className="cloud-b" fill="#fff" opacity="0.18">
          <ellipse cx="300" cy="230" rx="52" ry="13" />
          <ellipse cx="270" cy="221" rx="30" ry="11" />
        </g>
        <g className="cloud-a" fill="#fff" opacity="0.15">
          <ellipse cx="200" cy="330" rx="40" ry="10" />
        </g>

        {/* দূরের পাহাড় (কুয়াশা মাখা) */}
        <path
          d="M0 520 C40 470 90 440 140 470 C190 500 220 430 270 420 C320 410 360 460 400 440 L400 800 L0 800 Z"
          fill="#7FCFA6"
          opacity="0.5"
        />
        {/* মাঝের পাহাড় */}
        <path
          d="M0 590 C50 540 110 520 170 555 C230 590 280 510 340 520 C370 526 390 540 400 548 L400 800 L0 800 Z"
          fill="#2F9E68"
          opacity="0.85"
        />
        {/* কাছের পাহাড় + শাল বন */}
        <path
          d="M0 660 C60 620 120 610 190 640 C260 670 320 600 400 630 L400 800 L0 800 Z"
          fill="#0F6B3F"
        />
        <g fill="#0A3527">
          <use href="#sal" transform="translate(38 652)" />
          <use href="#sal" transform="translate(72 642) scale(1.1)" />
          <use href="#sal" transform="translate(108 640)" />
          <use href="#sal" transform="translate(312 626)" />
          <use href="#sal" transform="translate(346 616) scale(1.15)" />
          <use href="#sal" transform="translate(378 624)" />
        </g>
        {/* সামনের পাহাড় */}
        <path
          d="M0 730 C80 700 150 705 220 725 C290 745 350 705 400 715 L400 800 L0 800 Z"
          fill="#0A3527"
        />
        <g fill="#06241A">
          <use href="#sal" transform="translate(28 722) scale(1.5)" />
          <use href="#sal" transform="translate(62 716) scale(1.3)" />
          <use href="#sal" transform="translate(336 722) scale(1.4)" />
        </g>
      </svg>
    </>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

const inputClass =
  'w-full rounded-full bg-white/15 border border-white/40 text-white placeholder-white/55 pl-5 pr-12 py-3 text-sm outline-none focus:bg-white/25 focus:border-white/80 transition-colors';

const codeClass =
  'w-full rounded-2xl bg-white/15 border border-white/40 text-white placeholder-white/30 px-4 py-4 text-center text-2xl font-semibold tracking-[0.45em] outline-none focus:bg-white/25 focus:border-white/80 transition-colors';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // login | signup | forgot | recovery | verify
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [resendLeft, setResendLeft] = useState(0);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('recovery');
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  // "Resend code" বোতামের অপেক্ষার গণনা
  useEffect(() => {
    if (resendLeft <= 0) return undefined;
    const id = setTimeout(() => setResendLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendLeft]);

  function friendly(msg) {
    const m = (msg || '').toLowerCase();
    const hit = t.errors.find(([key]) => m.includes(key));
    return hit ? hit[1] : t.errorFallback;
  }

  function switchMode(next) {
    setMode(next);
    setError(null);
    setMessage(null);
    setCode('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const cleanEmail = email.trim();

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { name } },
        });
        if (error) {
          setError(friendly(error.message));
        } else if (data?.session) {
          // ইমেইল ভেরিফাই বন্ধ থাকলে সঙ্গে সঙ্গে লগইন হয়ে যায়
          window.location.href = getNextPath();
        } else if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          // এই ইমেইলে আগেই অ্যাকাউন্ট আছে: Supabase ভুল বোঝায় না, তাই কোডও আসবে না
          setError(friendly('already registered'));
        } else {
          setEmail(cleanEmail);
          setMode('verify');
          setCode('');
          setResendLeft(RESEND_SECONDS);
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (!error) {
          window.location.href = getNextPath();
        } else if ((error.message || '').toLowerCase().includes('email not confirmed')) {
          // আগে নিবন্ধন করেছিলেন কিন্তু কোড বসানো হয়নি: নতুন কোড পাঠিয়ে ভেরিফাই পর্দায় নিয়ে যাওয়া
          const res = await supabase.auth.resend({ type: 'signup', email: cleanEmail });
          setEmail(cleanEmail);
          setMode('verify');
          setCode('');
          if (res.error) setError(friendly(res.error.message));
          else {
            setMessage(t.resent);
            setResendLeft(RESEND_SECONDS);
          }
        } else {
          setError(friendly(error.message));
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) setError(friendly(error.message));
        else setMessage(t.resetSent);
      } else if (mode === 'recovery') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setError(friendly(error.message));
        } else {
          setMessage(t.passwordUpdated);
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1200);
        }
      }
    } catch (err) {
      setError(friendly(err?.message));
    }
    setLoading(false);
  }

  // ইমেইলে পাঠানো ৬ সংখ্যার কোড মেলালে তবেই অ্যাকাউন্ট চালু হয়
  async function verifyCode(value) {
    if (value.length !== CODE_LENGTH || loading) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: value, type: 'signup' });
      if (error) {
        setError(friendly(error.message));
        setCode('');
      } else {
        window.location.href = getNextPath();
        return;
      }
    } catch (err) {
      setError(friendly(err?.message));
    }
    setLoading(false);
  }

  function onCodeChange(e) {
    const value = e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(value);
    if (value.length === CODE_LENGTH) verifyCode(value);
  }

  async function handleResend() {
    if (resendLeft > 0 || loading) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        setError(friendly(error.message));
      } else {
        setMessage(t.resent);
        setResendLeft(RESEND_SECONDS);
      }
    } catch (err) {
      setError(friendly(err?.message));
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${getNextPath()}` },
    });
  }

  const showTabs = mode === 'login' || mode === 'signup';
  const needsPassword = mode === 'login' || mode === 'signup' || mode === 'recovery';
  const needsEmail = mode !== 'recovery';

  const submitLabel =
    mode === 'login' ? t.loginBtn : mode === 'signup' ? t.signupBtn : mode === 'forgot' ? t.resetBtn : t.saveBtn;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0A3527] via-[#1C8A4C] to-[#F0D58A]">
      <HillsBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <a href="/" className="bg-white rounded-xl px-4 py-2 shadow-lg mb-2">
          <img src="/logo-full.png" alt="Khuji Sherpur" className="h-9 w-auto" />
        </a>
        <p className="text-white/85 text-xs mb-5 drop-shadow">{t.tagline}</p>

        <div className="w-full max-w-sm bg-[#0A3527]/40 backdrop-blur-xl border border-white/30 rounded-3xl p-5 shadow-2xl text-white">
          {mode === 'verify' ? (
            <div>
              <button type="button" onClick={() => switchMode('signup')} className="text-xs text-white/70 mb-3">
                {t.wrongEmail}
              </button>
              <h1 className="text-xl font-semibold">{t.verifyTitle}</h1>
              <p className="text-sm text-white/75 mt-2 leading-relaxed">
                {t.verifyIntro} <span className="font-semibold text-white break-all">{email}</span>
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyCode(code);
                }}
                className="mt-5 space-y-3.5"
              >
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={CODE_LENGTH}
                  autoFocus
                  value={code}
                  onChange={onCodeChange}
                  placeholder={t.codePh}
                  aria-label="Verification code"
                  className={codeClass}
                />

                {error && (
                  <p className="text-sm bg-red-500/25 border border-red-300/50 rounded-2xl px-4 py-2.5">{error}</p>
                )}
                {message && (
                  <p className="text-sm bg-white/20 border border-white/40 rounded-2xl px-4 py-2.5">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== CODE_LENGTH}
                  className="w-full bg-marigold text-ink font-semibold rounded-full py-3 shadow-lg active:scale-[0.99] transition-transform disabled:opacity-50"
                >
                  {loading ? t.verifying : t.verifyBtn}
                </button>
              </form>

              <p className="text-xs text-white/65 mt-4 leading-relaxed">{t.verifyHint}</p>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendLeft > 0 || loading}
                className="mt-3 text-sm font-semibold underline text-white disabled:opacity-50 disabled:no-underline"
              >
                {resendLeft > 0 ? `${t.resend} (${resendLeft}s)` : t.resend}
              </button>
            </div>
          ) : (
            <>
              {showTabs ? (
                <div className="grid grid-cols-2 gap-1 bg-white/10 rounded-full p-1 mb-5">
                  {[
                    ['login', t.login],
                    ['signup', t.signup],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => switchMode(key)}
                      className={`py-2 rounded-full text-sm font-semibold transition-colors ${
                        mode === key ? 'bg-white text-[#0F4D3A] shadow' : 'text-white/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mb-5">
                  {mode === 'forgot' && (
                    <button type="button" onClick={() => switchMode('login')} className="text-xs text-white/70 mb-3">
                      {t.backToLogin}
                    </button>
                  )}
                  <h1 className="text-lg font-semibold">{mode === 'forgot' ? t.forgotTitle : t.recoveryTitle}</h1>
                  {mode === 'forgot' && <p className="text-xs text-white/70 mt-1">{t.forgotHelp}</p>}
                </div>
              )}

              {showTabs && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white text-ink rounded-full py-3 shadow active:scale-[0.99] transition-transform"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.88 2.69-6.64z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
                      <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.96H.96A8.996 8.996 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.99 2.34C4.66 5.16 6.65 3.58 9 3.58z"/>
                    </svg>
                    <span className="text-sm font-medium">{t.google}</span>
                  </button>

                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-white/25" />
                    <span className="text-xs text-white/60">{t.or}</span>
                    <div className="flex-1 h-px bg-white/25" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs mb-1.5 text-white/80 pl-3">{t.name}</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                        placeholder={t.namePh}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"><IconUser /></span>
                    </div>
                  </div>
                )}

                {needsEmail && (
                  <div>
                    <label className="block text-xs mb-1.5 text-white/80 pl-3">{t.email}</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        maxLength={120}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                        placeholder="you@example.com"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"><IconMail /></span>
                    </div>
                  </div>
                )}

                {needsPassword && (
                  <div>
                    <label className="block text-xs mb-1.5 text-white/80 pl-3">
                      {mode === 'recovery' ? t.newPassword : t.password}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass}
                        placeholder={t.passwordPh}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 text-[11px] font-medium"
                        aria-label={showPassword ? t.hide : t.show}
                      >
                        {showPassword ? t.hide : t.show}
                      </button>
                    </div>
                    {mode === 'login' && (
                      <div className="text-right mt-2">
                        <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-white/80 underline">
                          {t.forgot}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <p className="text-sm bg-red-500/25 border border-red-300/50 rounded-2xl px-4 py-2.5">{error}</p>
                )}
                {message && (
                  <p className="text-sm bg-white/20 border border-white/40 rounded-2xl px-4 py-2.5">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-marigold text-ink font-semibold rounded-full py-3 shadow-lg active:scale-[0.99] transition-transform disabled:opacity-50"
                >
                  {loading ? t.waiting : submitLabel}
                </button>
              </form>
            </>
          )}
        </div>

        {mode !== 'verify' && (
          <p className="text-center text-xs text-white/80 mt-5 max-w-xs drop-shadow">
            {t.termsLine1}{' '}
            <a href="/terms" className="underline">{t.terms}</a>{t.and}
            <a href="/privacy" className="underline">{t.privacy}</a>{t.termsLine2}
          </p>
        )}
      </div>
    </main>
  );
}
