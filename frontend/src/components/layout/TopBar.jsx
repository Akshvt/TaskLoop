import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationsDropdown from './NotificationsDropdown';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '56px',
      zIndex: 100,
      backgroundColor: 'var(--color-bg)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      <div style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 700,
        fontSize: '18px',
        color: 'var(--color-jade)'
      }}>
        Namhya Tasks
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <span style={{
          fontFamily: '"Inter", sans-serif',
          fontWeight: 500,
          fontSize: '14px',
          color: 'var(--color-text-primary)'
        }}>
          {user?.name}
        </span>
        <NotificationsDropdown />
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.background = 'var(--color-surface-2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--color-text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
