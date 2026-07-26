import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import { useToast } from '../common/Toast';

const STATUSES   = ['To Do', 'In Progress', 'Done', 'Blocked'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const formatRelative = (d) => {
  const diff = Math.round((Date.now() - new Date(d)) / 60000);
  if (diff < 1)    return 'just now';
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return formatDate(d);
};

const LABEL = { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '8px', fontFamily: '"Inter", sans-serif' };
const SECTION = { display: 'flex', flexDirection: 'column', gap: '0' };

export default function TaskDrawer({ task, onClose, onUpdate, onDelete, employees }) {
  const { user } = useAuth();
  const addToast  = useToast();
  const isFounder = user?.role === 'founder';

  const [isEditing, setIsEditing]   = useState(false);
  const [editFields, setEditFields] = useState({
    title:       task.title,
    description: task.description,
    deadline:    task.deadline ? task.deadline.slice(0, 10) : '',
    priority:    task.priority,
    assignedTo:  task.assignedTo?._id || task.assignedTo,
  });
  const [noteText, setNoteText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.put(`/api/tasks/${task._id}`, { status: newStatus });
      onUpdate(res.data);
      addToast('Status updated', 'success');
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/api/tasks/${task._id}`, {
        title:       editFields.title,
        description: editFields.description,
        deadline:    editFields.deadline,
        priority:    editFields.priority,
        assignedTo:  editFields.assignedTo,
      });
      onUpdate(res.data);
      setIsEditing(false);
      addToast('Task updated', 'success');
    } catch {
      addToast('Failed to update task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      const res = await api.post(`/api/tasks/${task._id}/notes`, { text: noteText });
      onUpdate(res.data);
      setNoteText('');
      addToast('Note added', 'success');
    } catch {
      addToast('Failed to add note', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/tasks/${task._id}`);
      onDelete(task._id);
      addToast('Task deleted', 'success');
    } catch {
      addToast('Failed to delete task', 'error');
    }
  };

  const sortedNotes = task.notes
    ? [...task.notes].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    : [];

  const inputStyle = {
    padding: '8px 10px',
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
    width: '100%',
    fontFamily: '"Inter", sans-serif',
    outline: 'none',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          top: '56px',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 150,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: '56px',
        right: 0,
        width: '440px',
        height: 'calc(100vh - 56px)',
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        zIndex: 151,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        transform: 'translateX(0)',
        animation: 'slideInDrawer 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <style>{`
          @keyframes slideInDrawer {
            from { transform: translateX(100%); }
            to   { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '20px', padding: '0', lineHeight: 1 }}
          >
            ←
          </button>
          <PriorityBadge priority={task.priority} />
        </div>

        {/* Title + meta */}
        {isEditing ? (
          <div style={SECTION}>
            <div style={LABEL}>Title</div>
            <input
              value={editFields.title}
              onChange={e => setEditFields(p => ({ ...p, title: e.target.value }))}
              style={inputStyle}
            />
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              {task.title}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Assigned to {task.assignedTo?.name} · Due {formatDate(task.deadline)}
            </div>
          </div>
        )}

        {/* Description */}
        <div style={SECTION}>
          <div style={LABEL}>Description</div>
          {isEditing ? (
            <textarea
              value={editFields.description}
              onChange={e => setEditFields(p => ({ ...p, description: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          ) : (
            <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
              {task.description || <span style={{ color: 'var(--color-text-muted)' }}>No description</span>}
            </div>
          )}
        </div>

        {/* Deadline + Priority + Assignee (edit mode only) */}
        {isEditing && (
          <>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ ...SECTION, flex: 1 }}>
                <div style={LABEL}>Deadline</div>
                <input type="date" value={editFields.deadline} onChange={e => setEditFields(p => ({ ...p, deadline: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ ...SECTION, flex: 1 }}>
                <div style={LABEL}>Priority</div>
                <select value={editFields.priority} onChange={e => setEditFields(p => ({ ...p, priority: e.target.value }))} style={inputStyle}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={SECTION}>
              <div style={LABEL}>Assignee</div>
              <select value={editFields.assignedTo} onChange={e => setEditFields(p => ({ ...p, assignedTo: e.target.value }))} style={inputStyle}>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Status */}
        <div style={SECTION}>
          <div style={LABEL}>Status</div>
          <select
            value={task.status}
            onChange={e => handleStatusChange(e.target.value)}
            style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={LABEL}>Notes</div>
          {sortedNotes.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No notes yet</div>
          ) : (
            sortedNotes.map((note, i) => (
              <div key={i} style={{
                padding: '10px 12px',
                background: 'var(--color-surface-2)',
                borderRadius: '4px',
                fontSize: '13px',
                lineHeight: 1.5,
              }}>
                <div style={{ color: 'var(--color-text-primary)', marginBottom: '4px' }}>{note.text}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>
                  {note.addedBy?.name} · {formatRelative(note.addedAt)}
                </div>
              </div>
            ))
          )}
          <textarea
            placeholder="Add a note..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim()}
            style={{
              padding: '8px 16px',
              background: 'var(--color-jade)',
              color: '#0D1117',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: noteText.trim() ? 'pointer' : 'not-allowed',
              opacity: noteText.trim() ? 1 : 0.5,
              alignSelf: 'flex-start'
            }}
          >
            Add Note
          </button>
        </div>

        {/* Details */}
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.8, borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div>Created by {task.createdBy?.name || 'N/A'} · {formatDate(task.createdAt)}</div>
          <div>Last updated {formatRelative(task.lastUpdated)}</div>
        </div>

        {/* Founder actions */}
        {isFounder && (
          <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            {isEditing ? (
              <>
                <button onClick={handleSaveEdit} disabled={saving} style={{ padding: '8px 16px', background: 'var(--color-jade)', color: '#0D1117', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                Edit
              </button>
            )}

            {confirmDelete ? (
              <>
                <button onClick={handleDelete} style={{ padding: '8px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                  Confirm Delete
                </button>
                <button onClick={() => setConfirmDelete(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginLeft: 'auto' }}>
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
