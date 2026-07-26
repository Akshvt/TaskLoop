import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../common/Toast';

const today = new Date().toISOString().slice(0, 10);

const OVERLAY = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  zIndex: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const INPUT = {
  padding: '10px 12px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  width: '100%',
  fontFamily: '"Inter", sans-serif',
  outline: 'none',
};

const LABEL = {
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  marginBottom: '6px',
  display: 'block',
};

export default function CreateTaskModal({ employees, onClose, onCreated }) {
  const addToast = useToast();

  const [title, setTitle]           = useState('');
  const [description, setDesc]      = useState('');
  const [assignedTo, setAssignedTo] = useState(employees[0]?._id || '');
  const [deadline, setDeadline]     = useState('');
  const [priority, setPriority]     = useState('Medium');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (employees.length > 0 && !assignedTo) {
      setAssignedTo(employees[0]._id);
    }
  }, [employees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo || !deadline) {
      setError('Title, assignee, and deadline are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/tasks', { title, description, assignedTo, deadline, priority });
      onCreated(res.data);
      addToast('Task created', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={OVERLAY} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '480px',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{
          margin: 0,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 700,
          fontSize: '20px',
          color: 'var(--color-text-primary)',
        }}>
          Create Task
        </h2>

        {error && (
          <div style={{ color: 'var(--color-red)', fontSize: '13px' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={LABEL}>Title *</label>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL}>Description</label>
            <textarea
              placeholder="What needs to be done?"
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              style={{ ...INPUT, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={LABEL}>Assign To *</label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              required
              style={{ ...INPUT, cursor: 'pointer' }}
            >
              <option value="">Select employee</option>
              {employees.map(e => (
                <option key={e._id} value={e._id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={LABEL}>Deadline *</label>
            <input
              type="date"
              value={deadline}
              min={today}
              onChange={e => setDeadline(e.target.value)}
              required
              style={INPUT}
            />
          </div>

          <div>
            <label style={LABEL}>Priority</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['High', 'Medium', 'Low'].map(p => {
                const colors = { High: '#EF4444', Medium: '#F4A836', Low: '#6B7280' };
                const active = priority === p;
                return (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={active}
                      onChange={() => setPriority(p)}
                      style={{ accentColor: colors[p] }}
                    />
                    <span style={{ fontSize: '14px', color: active ? colors[p] : 'var(--color-text-muted)', fontWeight: active ? 600 : 400 }}>
                      {p}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: 'var(--color-jade)',
                color: '#0D1117',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
