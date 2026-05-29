import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllRead,
  onClose,
}: {
  notifications: ReturnType<typeof useNotifications>['notifications'];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const handleClick = (notif: typeof notifications[0]) => {
    if (!notif.read) onMarkAsRead(notif._id);
    if (notif.link !== '#') navigate(notif.link);
    onClose();
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-border shadow-float py-2 animate-fade-in z-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <h3 className="text-sm font-semibold text-ink">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-accent hover:text-accent-dark font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-ink-soft">No notifications yet</p>
            <p className="text-xs text-ink-faint mt-1">We&apos;ll notify you when your questions get answered</p>
          </div>
        ) : (
          notifications.slice(0, 10).map(notif => (
            <button
              key={notif._id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left px-4 py-3 border-b border-border/30 hover:bg-bg transition-colors ${
                !notif.read ? 'bg-accent-light/30' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                {/* Unread dot */}
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${!notif.read ? 'text-ink' : 'text-ink-soft'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-ink-faint mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-ink-faint/60 mt-1">
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-border/50">
        <p className="text-xs text-ink-faint text-center">Click to view details</p>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  // Refresh on focus (in case user resolves something in another tab)
  useEffect(() => {
    const handleFocus = () => refresh();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="hidden lg:flex w-9 h-9 items-center justify-center rounded-full hover:bg-black/[0.04] transition-colors relative cursor-pointer"
        aria-label="Notifications"
      >
        <BellIcon hasUnread={unreadCount > 0} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllRead={markAllAsRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}