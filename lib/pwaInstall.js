import { supabase } from './supabaseClient';

const FB_APP = /FBAN|FBAV|FB_IAB|Instagram/i;

export function store(action, key, value) {
  try {
    if (action === 'get') return localStorage.getItem(key);
    if (action === 'set') localStorage.setItem(key, value);
  } catch (e) {}
  return null;
}

export function isStandalone() {
  return (
    window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
  );
}

export function isInstalled() {
  return isStandalone() || store('get', 'ks_pwa_installed') === '1';
}

function getDeviceId() {
  let id = store('get', 'ks_device_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
    store('set', 'ks_device_id', id);
  }
  return id;
}

async function reportInstall() {
  if (store('get', 'ks_install_reported') === '1') return;
  const ua = navigator.userAgent || '';
  const platform = /Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'other';
  try {
    const { error } = await supabase.from('pwa_installs').insert({
      device_id: getDeviceId(),
      platform,
      user_agent: ua.slice(0, 300),
    });
    if (!error || error.code === '23505') store('set', 'ks_install_reported', '1');
  } catch (e) {}
}

export function markInstalled() {
  store('set', 'ks_pwa_installed', '1');
  reportInstall();
}

export function startInstallListeners() {
  if (window.__ksInstallInit) return;
  window.__ksInstallInit = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__ksPrompt = e;
  });
  window.addEventListener('appinstalled', () => {
    window.__ksPrompt = null;
    markInstalled();
    window.dispatchEvent(new Event('ks-installed'));
  });
}

export function triggerInstall() {
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const inApp = FB_APP.test(ua) || (isAndroid && /; wv\)/.test(ua));

  // ফেসবুক বা অন্য অ্যাপের ভেতরের ব্রাউজার থেকে Chrome-এ খুলুন
  if (inApp && isAndroid) {
    const u = new URL(window.location.href);
    u.searchParams.set('install', '1');
    window.location.href =
      'intent://' + u.host + u.pathname + u.search +
      '#Intent;scheme=https;package=com.android.chrome;' +
      'S.browser_fallback_url=' + encodeURIComponent(u.href) + ';end';
    return;
  }

  const p = window.__ksPrompt;
  if (p) {
    p.prompt();
    window.__ksPrompt = null;
    return;
  }

  if (isIos) {
    alert(
      inApp
        ? 'ডানদিকের মেনু থেকে "Safari-তে খুলুন" চাপুন, তারপর Share বাটন থেকে "Add to Home Screen" দিন।'
        : 'নিচের Share বাটন চাপুন, তারপর "Add to Home Screen" দিন।'
    );
    return;
  }

  alert('Chrome-এর মেনু (⋮) থেকে "Install app" বা "Add to Home screen" চাপুন।');
}
