import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) handleMarkRead(n._id);
    setIsOpen(false);
    if (n.task) {
      navigate('/tasks');
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--color-surface)',
          border: 'var(--neo-border)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          padding: '8px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--neo-border-radius)',
          transition: 'all 0.1s',
          boxShadow: 'var(--neo-shadow)',
        }}
        onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'var(--neo-shadow-active)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = 'var(--neo-shadow)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = 'var(--neo-shadow)'; }}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}><Bell size={20} strokeWidth={2.5} /></span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: 'var(--color-urgent)',
            color: '#000',
            fontSize: '11px',
            fontWeight: 800,
            border: '2px solid #000',
            borderRadius: 'var(--neo-border-radius)',
            padding: '2px 6px',
            textAlign: 'center',
            boxShadow: '2px 2px 0px #000'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '12px',
          width: '320px',
          background: 'var(--color-surface)',
          border: 'var(--neo-border)',
          borderRadius: 'var(--neo-border-radius)',
          boxShadow: 'var(--neo-shadow)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '400px',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: 'var(--neo-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--color-surface-2)'
          }}>
            <span style={{ fontWeight: 800, fontSize: '15px', fontFamily: '"Plus Jakarta Sans", sans-serif', color: 'var(--color-text-primary)' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'var(--color-primary)',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  color: '#000',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  boxShadow: '2px 2px 0px #000',
                  textTransform: 'uppercase'
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px #000'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0px #000'; }}
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 600 }}>
                No notifications
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    background: n.isRead ? 'transparent' : 'var(--color-surface-2)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseOut={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'var(--color-surface-2)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: n.isRead ? 500 : 700, lineHeight: 1.4 }}>
                      {n.message}
                    </span>
                    {!n.isRead && (
                      <div style={{ width: '10px', height: '10px', border: '2px solid #000', borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: '4px' }} />
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
