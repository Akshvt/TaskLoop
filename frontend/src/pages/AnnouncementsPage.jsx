import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useToast } from '../components/common/Toast';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

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

function PostModal({ onClose, onPosted }) {
  const addToast = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/announcements', { title, body });
      onPosted(res.data);
      addToast('Announcement posted', 'success');
      onClose();
    } catch {
      addToast('Failed to post announcement', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={OVERLAY} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '480px',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <h2 style={{ margin: 0, fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--color-text-primary)' }}>
          Post Announcement
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={INPUT}
          />
          <textarea
            placeholder="Write your announcement..."
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            required
            style={{ ...INPUT, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: 'var(--color-jade)', color: '#0D1117', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const addToast  = useToast();
  const isFounder = user?.role === 'founder';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);

  useEffect(() => {
    api.get('/api/announcements')
      .then(res => setAnnouncements(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      addToast('Announcement deleted', 'success');
    } catch {
      addToast('Failed to delete announcement', 'error');
    }
  };

  const handlePosted = (newAnnouncement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '24px', color: 'var(--color-text-primary)' }}>
          Announcements
        </h1>
        {isFounder && (
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '10px 18px', background: 'var(--color-jade)', color: '#0D1117', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            + Post Announcement
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : announcements.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', padding: '48px', textAlign: 'center' }}>No announcements yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {announcements.map(a => (
            <div key={a._id} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, fontSize: '16px', color: 'var(--color-text-primary)' }}>
                  {a.title}
                </div>
                {isFounder && (
                  <button
                    onClick={() => handleDelete(a._id)}
                    title="Delete announcement"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1, padding: '0', flexShrink: 0 }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--color-red)'}
                    onMouseOut={e  => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  >
                    ×
                  </button>
                )}
              </div>
              <div style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text-primary)' }}>
                {a.body}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {a.createdBy?.name} · {formatDate(a.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PostModal onClose={() => setShowModal(false)} onPosted={handlePosted} />
      )}
    </div>
  );
}
