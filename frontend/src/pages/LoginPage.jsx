import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import { Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const isGmail = /^[^\s@]+@gmail\.com$/.test(email);
    const isFounderEmail = email === 'founder@namhyafoods.com';

    if (selectedRole === 'founder' && !isFounderEmail) {
      setError('Please use the founder email address');
      return;
    }

    if (selectedRole === 'employee' && isFounderEmail) {
      setError('Please use the Founder role to log in with this email');
      return;
    }

    if (!isFounderEmail && !isGmail) {
      setError('Please use a Gmail address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data.user.role !== selectedRole) {
        setError(`You tried to log in as ${selectedRole} but this account is registered as ${response.data.user.role}.`);
        return;
      }

      login(response.data.token, response.data.user);
      
      if (response.data.user.role === 'founder') {
        navigate('/');
      } else {
        navigate('/tasks');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '12px 14px',
    background: 'var(--color-surface-2)',
    border: 'var(--neo-border)',
    borderRadius: 'var(--neo-border-radius)',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 600,
    outline: 'none',
    boxShadow: 'var(--neo-shadow)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, var(--color-surface-2) 0%, var(--color-bg) 100%)',
      padding: '20px'
    }}>
      <div style={{
        width: '400px',
        background: 'var(--color-surface)',
        border: 'var(--neo-border)',
        borderRadius: 'var(--neo-border-radius)',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '8px 8px 0px #000',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{
            margin: 0,
            color: 'var(--color-primary)',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 900,
            fontSize: '32px',
          }}>
            Namhya Tasks
          </h1>
          <button 
            type="button"
            onClick={toggleTheme}
            title="Toggle theme"
            style={{ 
              background: 'var(--color-surface-2)', 
              border: '2px solid #000', 
              boxShadow: '2px 2px 0px #000',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.1s',
              color: 'var(--color-text-primary)'
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {error && (
          <div style={{
            color: '#000',
            background: 'var(--color-urgent)',
            border: '2px solid #000',
            boxShadow: '2px 2px 0px #000',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 800,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Role Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--color-surface-2)',
            border: '2px solid #000',
            boxShadow: '2px 2px 0px #000',
            borderRadius: '6px',
            padding: '4px',
            marginBottom: '8px',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => { setSelectedRole('employee'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: selectedRole === 'employee' ? '2px solid #000' : 'none',
                borderRadius: '4px',
                background: selectedRole === 'employee' ? 'var(--color-primary)' : 'transparent',
                color: selectedRole === 'employee' ? '#000' : 'var(--color-text-muted)',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.1s',
                boxShadow: selectedRole === 'employee' ? '2px 2px 0px #000' : 'none',
                textTransform: 'uppercase'
              }}
            >
              Employee
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('founder'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: selectedRole === 'founder' ? '2px solid #000' : 'none',
                borderRadius: '4px',
                background: selectedRole === 'founder' ? 'var(--color-primary)' : 'transparent',
                color: selectedRole === 'founder' ? '#000' : 'var(--color-text-muted)',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.1s',
                boxShadow: selectedRole === 'founder' ? '2px 2px 0px #000' : 'none',
                textTransform: 'uppercase'
              }}
            >
              Founder
            </button>
          </div>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px',
              background: 'var(--color-primary)',
              color: '#000',
              border: '2px solid #000',
              boxShadow: '4px 4px 0px #000',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              textTransform: 'uppercase',
              transition: 'all 0.1s',
              marginTop: '8px'
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #000'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #000'; }}
          >
            {loading ? 'Signing in...' : `Continue as ${selectedRole === 'founder' ? 'Founder' : 'Employee'}`}
          </button>
        </form>

        {selectedRole === 'employee' && (
          <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Don't have an account? </span>
            <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 800 }}>
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
