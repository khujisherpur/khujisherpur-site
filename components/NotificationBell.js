'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // প্রতি ৩০ সেকেন্ডে রিফ্রেশ
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('id, message, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
  }

  async function markAsRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative text-xl border border-ink/20 rounded-full w-9 h-9 flex items-center justify-center hover:bg-paper"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-ink/10 shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink/10">
            <span className="text-sm font-medium">নোটিফিকেশন</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-green hover:underline">
                সব পড়া হয়েছে
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-ink/50 text-center py-8">কোনো নোটিফিকেশন নেই।</p>
          ) : (
            notifications.map((n) => (
              <a
                key={n.id}
                href={n.link || '/dashboard'}
                onClick={() => markAsRead(n.id)}
                className={`block px-4 py-3 border-b border-ink/5 text-sm hover:bg-paper ${
                  !n.is_read ? 'bg-marigold/5' : ''
                }`}
              >
                <p className={!n.is_read ? 'font-medium' : 'text-ink/70'}>{n.message}</p>
                <p className="text-xs text-ink/40 mt-1">
                  {new Date(n.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                </p>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
