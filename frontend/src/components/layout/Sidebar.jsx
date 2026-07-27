import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, CheckSquare, Users, Megaphone } from 'lucide-react';

const NAV_ICONS = {
  Dashboard: <LayoutDashboard size={20} strokeWidth={2.5} />,
  Tasks: <CheckSquare size={20} strokeWidth={2.5} />,
  'My Tasks': <CheckSquare size={20} strokeWidth={2.5} />,
  Employees: <Users size={20} strokeWidth={2.5} />,
  Announcements: <Megaphone size={20} strokeWidth={2.5} />
};

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const isFounder = user?.role === 'founder';

  const navItems = isFounder
    ? [
        { name: 'Dashboard', path: '/' },
        { name: 'Tasks', path: '/tasks' },
        { name: 'Employees', path: '/employees' },
        { name: 'Announcements', path: '/announcements' },
      ]
    : [
        { name: 'My Tasks', path: '/tasks' },
        { name: 'Announcements', path: '/announcements' },
      ];

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '230px',
      height: '100vh',
      backgroundColor: 'var(--color-sidebar)',
      borderRight: 'var(--neo-border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 101,
      transition: 'background-color 0.2s, border-color 0.2s'
    }}>
      <div style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: 'var(--neo-border)',
        backgroundColor: 'var(--color-surface)',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: 'var(--color-primary)',
          borderRadius: 'var(--neo-border-radius)',
          border: 'var(--neo-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontWeight: 900,
          fontSize: '20px',
          boxShadow: 'var(--neo-shadow)'
        }}>N</div>
        <div style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 800,
          fontSize: '20px',
          color: 'var(--color-text-primary)'
        }}>
          Namhya
        </div>
      </div>

      <nav style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.name}
              to={item.path}
              style={{
                textDecoration: 'none',
                padding: '12px 14px',
                borderRadius: 'var(--neo-border-radius)',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: isActive ? 800 : 600,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: isActive ? '#000' : 'var(--color-text-primary)',
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                border: isActive ? 'var(--neo-border)' : '2px solid transparent',
                boxShadow: isActive ? 'var(--neo-shadow)' : 'none',
                transition: 'all 0.1s',
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-2)';
                  e.currentTarget.style.border = '2px solid var(--color-border)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.border = '2px solid transparent';
                }
              }}
              onMouseDown={(e) => {
                if (isActive) {
                  e.currentTarget.style.transform = 'translate(2px, 2px)';
                  e.currentTarget.style.boxShadow = 'var(--neo-shadow-active)';
                }
              }}
              onMouseUp={(e) => {
                if (isActive) {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = 'var(--neo-shadow)';
                }
              }}
            >
              <span style={{ 
                display: 'flex',
                alignItems: 'center',
                opacity: isActive ? 1 : 0.7
              }}>
                {NAV_ICONS[item.name]}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
