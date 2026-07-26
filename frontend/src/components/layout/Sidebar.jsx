import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
      top: '56px',
      left: 0,
      width: '200px',
      height: 'calc(100vh - 56px)',
      backgroundColor: 'var(--color-bg)',
      borderRight: '1px solid var(--color-border)',
      paddingTop: '24px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        
        return (
          <Link
            key={item.name}
            to={item.path}
            style={{
              textDecoration: 'none',
              padding: '12px 24px',
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              color: isActive ? 'var(--color-jade)' : 'var(--color-text-secondary)',
              backgroundColor: isActive ? 'var(--color-jade-dim)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--color-jade)' : '3px solid transparent',
              transition: 'background-color 0.2s, color 0.2s',
            }}
          >
            {item.name}
          </Link>
        );
      })}
    </aside>
  );
}
