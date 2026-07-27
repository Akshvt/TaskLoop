import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationsDropdown from './NotificationsDropdown';
import { Sun, Moon, Settings, Search, LogOut } from 'lucide-react';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pageTitle = {
    '/': 'Project Dashboard',
    '/tasks': 'Tasks Overview',
    '/employees': 'Team Members',
    '/announcements': 'Announcements'
  }[location.pathname] || 'Project Dashboard';

  const iconBtnStyle = {
    background: 'var(--color-surface)',
    border: 'var(--neo-border)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: 'var(--neo-border-radius)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.1s',
    boxShadow: 'var(--neo-shadow)',
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: '230px',
      width: 'calc(100% - 230px)',
      height: '72px',
      zIndex: 100,
      backgroundColor: 'var(--color-bg)',
      borderBottom: 'var(--neo-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      transition: 'background-color 0.2s, border-color 0.2s'
    }}>
      <div style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 800,
        fontSize: '24px',
        color: 'var(--color-text-primary)'
      }}>
        {pageTitle}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
            <Search size={16} strokeWidth={2.5} />
          </span>
          <input 
            type="text" 
            placeholder="Search tasks..." 
            style={{
              background: 'var(--color-surface)',
              border: 'var(--neo-border)',
              borderRadius: 'var(--neo-border-radius)',
              padding: '8px 16px 8px 36px',
              color: 'var(--color-text-primary)',
              fontFamily: '"Inter", sans-serif',
              fontSize: '14px',
              outline: 'none',
              width: '240px',
              boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.05)',
              fontWeight: 500
            }}
          />
        </div>

        {/* Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            style={iconBtnStyle} 
            title="Toggle Theme" 
            onClick={toggleTheme}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'var(--neo-shadow-active)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = 'var(--neo-shadow)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = 'var(--neo-shadow)'; }}
          >
            {theme === 'dark' ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
          </button>
          <button 
            style={iconBtnStyle} 
            title="Settings"
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'var(--neo-shadow-active)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = 'var(--neo-shadow)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = 'var(--neo-shadow)'; }}
          >
            <Settings size={20} strokeWidth={2.5} />
          </button>
          <NotificationsDropdown />
        </div>

        {/* Avatar & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: 'var(--neo-border)', paddingLeft: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--neo-border-radius)',
              background: 'var(--color-primary)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              border: '2px solid #000',
              boxShadow: '2px 2px 0px #000',
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                {user?.name}
              </span>
              <span style={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user?.role}
              </span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            title="Logout"
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--neo-border-radius)',
              background: 'var(--color-urgent)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              border: '2px solid #000',
              boxShadow: '2px 2px 0px #000',
              transition: 'all 0.1s',
              textTransform: 'uppercase',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'none'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0px #000'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0px #000'; }}
          >
            <LogOut size={16} strokeWidth={2.5} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
