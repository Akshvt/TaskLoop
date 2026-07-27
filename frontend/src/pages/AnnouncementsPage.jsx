import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useToast } from '../components/common/Toast';
import { formatDistanceToNow } from 'date-fns';
import { Megaphone, Plus, X } from 'lucide-react';

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
  padding: '12px 14px',
  background: 'var(--color-surface)',
  border: 'var(--neo-border)',
  borderRadius: 'var(--neo-border-radius)',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  width: '100%',
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  fontWeight: 600,
  outline: 'none',
  boxShadow: 'var(--neo-shadow)',
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
        border: 'var(--neo-border)',
        borderRadius: 'var(--neo-border-radius)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '8px 8px 0px #000',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={24} color="var(--color-primary)" /> Post Announcement
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
            <X size={24} />
          </button>
        </div>
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
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'var(--color-surface)', border: '2px solid #000', boxShadow: '2px 2px 0px #000', color: 'var(--color-text-primary)', borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: 'var(--color-primary)', color: '#000', border: '2px solid #000', boxShadow: '2px 2px 0px #000', borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, textTransform: 'uppercase' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '28px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          Announcements <Megaphone size={28} strokeWidth={2.5} color="var(--color-primary)" />
        </h1>
        {isFounder && (
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '10px 18px', background: 'var(--color-primary)', color: '#000', border: '2px solid #000', boxShadow: '4px 4px 0px #000', borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.1s' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #000'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #000'; }}
          >
            <Plus size={18} strokeWidth={3} /> Post Announcement
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Loading...</div>
      ) : announcements.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', padding: '48px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--neo-border-radius)', border: 'var(--neo-border)', boxShadow: 'var(--neo-shadow)', fontWeight: 600 }}>No announcements yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {announcements.map(a => (
            <div key={a._id} style={{
              background: 'var(--color-surface)',
              border: 'var(--neo-border)',
              borderLeft: '8px solid var(--color-primary)',
              borderRadius: 'var(--neo-border-radius)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative',
              boxShadow: 'var(--neo-shadow)',
              transition: 'all 0.1s'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '20px', color: 'var(--color-text-primary)' }}>
                  {a.title}
                </div>
                {isFounder && (
                  <button
                    onClick={() => handleDelete(a._id)}
                    title="Delete announcement"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0', flexShrink: 0, transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--color-urgent)'}
                    onMouseOut={e  => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <div style={{ fontFamily: '"Inter", sans-serif', fontSize: '15px', lineHeight: 1.7, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {a.body}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Posted by {a.createdBy?.name || 'Unknown'} · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
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
