import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import { useToast } from '../common/Toast';
import { Paperclip, Image as ImageIcon, FileText, FileSpreadsheet, Archive, ArrowLeft, X } from 'lucide-react';

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

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type) => {
  if (!type) return <Paperclip size={18} />;
  if (type.startsWith('image/')) return <ImageIcon size={18} />;
  if (type.includes('pdf'))     return <FileText size={18} />;
  if (type.includes('sheet') || type.includes('csv') || type.includes('excel')) return <FileSpreadsheet size={18} />;
  if (type.includes('doc') || type.includes('word')) return <FileText size={18} />;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar'))  return <Archive size={18} />;
  return <Paperclip size={18} />;
};

const LABEL = { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '8px', fontFamily: '"Inter", sans-serif' };
const SECTION = { display: 'flex', flexDirection: 'column', gap: '0' };

export default function TaskDrawer({ task, onClose, onUpdate, onDelete, employees }) {
  const { user } = useAuth();
  const addToast  = useToast();
  const isFounder = user?.role === 'founder';
  const fileInputRef = useRef(null);

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

  // New state
  const [activeTab, setActiveTab] = useState('subtasks');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [uploading, setUploading] = useState(false);

  // ─── Existing handlers ─────────────────────────────────────────────────────

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

  // ─── Subtask handlers ──────────────────────────────────────────────────────

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      const res = await api.post(`/api/tasks/${task._id}/subtasks`, { title: newSubtaskTitle.trim() });
      onUpdate(res.data);
      setNewSubtaskTitle('');
      addToast('Subtask added', 'success');
    } catch {
      addToast('Failed to add subtask', 'error');
    }
  };

  const handleToggleSubtask = async (subtaskId, currentDone) => {
    try {
      const res = await api.patch(`/api/tasks/${task._id}/subtasks/${subtaskId}`, { isDone: !currentDone });
      onUpdate(res.data);
    } catch {
      addToast('Failed to update subtask', 'error');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const res = await api.delete(`/api/tasks/${task._id}/subtasks/${subtaskId}`);
      onUpdate(res.data);
      addToast('Subtask deleted', 'success');
    } catch {
      addToast('Failed to delete subtask', 'error');
    }
  };

  // ─── Comment handlers ──────────────────────────────────────────────────────

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/api/tasks/${task._id}/comments`, { text: commentText.trim() });
      onUpdate(res.data);
      setCommentText('');
      addToast('Comment added', 'success');
    } catch {
      addToast('Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.delete(`/api/tasks/${task._id}/comments/${commentId}`);
      onUpdate(res.data);
      addToast('Comment deleted', 'success');
    } catch {
      addToast('Failed to delete comment', 'error');
    }
  };

  // ─── Attachment handlers ───────────────────────────────────────────────────

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/api/tasks/${task._id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpdate(res.data);
      addToast('File uploaded', 'success');
    } catch {
      addToast('Failed to upload file', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const res = await api.delete(`/api/tasks/${task._id}/attachments/${attachmentId}`);
      onUpdate(res.data);
      addToast('Attachment deleted', 'success');
    } catch {
      addToast('Failed to delete attachment', 'error');
    }
  };

  // ─── Derived data ──────────────────────────────────────────────────────────

  const sortedNotes = task.notes
    ? [...task.notes].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    : [];

  const sortedComments = task.comments
    ? [...task.comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  const progress = task.progress ?? 0;

  const inputStyle = {
    padding: '10px 12px',
    background: 'var(--color-surface-2)',
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

  const tabButtonStyle = (isActive) => ({
    flex: 1,
    padding: '10px 0',
    background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
    border: 'var(--neo-border)',
    borderRadius: '4px',
    color: isActive ? '#000' : 'var(--color-text-primary)',
    fontWeight: 800,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    transition: 'all 0.1s',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    boxShadow: isActive ? '2px 2px 0px #000' : 'none',
  });

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
      <div 
        data-theme="dark"
        style={{
        position: 'fixed',
        top: '72px',
        right: 0,
        width: '480px',
        height: 'calc(100vh - 72px)',
        background: 'var(--color-surface)',
        borderLeft: '4px solid #000',
        boxShadow: '-6px 0 0 #000',
        zIndex: 151,
        overflowY: 'auto',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        transform: 'translateX(0)',
        animation: 'slideInDrawer 0.25s cubic-bezier(0.4,0,0.2,1)',
        color: 'var(--color-text-primary)'
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
            style={{ background: 'var(--color-surface-2)', border: '2px solid #000', borderRadius: '4px', color: 'var(--color-text-primary)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0px #000' }}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <PriorityBadge priority={task.priority} variant="number" />
            <select
              value={task.status}
              onChange={e => handleStatusChange(e.target.value)}
              style={{
                appearance: 'none',
                background: `var(--color-status-${task.status.toLowerCase().replace(' ', '')})`,
                border: '2px solid #000',
                boxShadow: '2px 2px 0px #000',
                color: '#000',
                borderRadius: '6px',
                padding: '4px 28px 4px 12px',
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
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
            <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '24px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              {task.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {task.assignedTo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary)', color: '#101010',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold'
                  }}>
                    {task.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{task.assignedTo.name}</span>
                </div>
              )}
              <span>·</span>
              <span>Due {formatDate(task.deadline)}</span>
              {task.status === 'Done' && task.completedAt && new Date(task.completedAt) > new Date(task.deadline) && (
                <span style={{ color: 'var(--color-saffron)', fontWeight: 600 }}>(Late)</span>
              )}
            </div>
          </div>
        )}

        {/* ─── Progress Bar ─────────────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ ...LABEL, marginBottom: 0 }}>Progress</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: progress >= 100 ? 'var(--color-jade)' : 'var(--color-text-primary)' }}>
              {progress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '10px',
            background: 'var(--color-surface-2)',
            borderRadius: '5px',
            overflow: 'hidden',
            border: '2px solid #000',
            boxShadow: '2px 2px 0px #000',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: progress >= 100
                ? 'var(--color-jade)'
                : progress >= 50
                  ? 'var(--color-saffron)'
                  : 'var(--color-status-todo)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

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

        {/* Removed duplicate status section */}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TABBED SECTIONS — Subtasks, Attachments, Comments                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '16px',
          }}>
            <button style={tabButtonStyle(activeTab === 'subtasks')}   onClick={() => setActiveTab('subtasks')}>
              Subtasks {task.subtasks?.length ? `(${task.subtasks.length})` : ''}
            </button>
            <button style={tabButtonStyle(activeTab === 'attachments')} onClick={() => setActiveTab('attachments')}>
              Files {task.attachments?.length ? `(${task.attachments.length})` : ''}
            </button>
            <button style={tabButtonStyle(activeTab === 'comments')}    onClick={() => setActiveTab('comments')}>
              Comments {task.comments?.length ? `(${task.comments.length})` : ''}
            </button>
          </div>

          {/* ─── Subtasks Tab ────────────────────────────────────────────── */}
          {activeTab === 'subtasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(!task.subtasks || task.subtasks.length === 0) && (
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '8px 0' }}>No subtasks yet</div>
              )}
              {task.subtasks?.map(st => (
                <div key={st._id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  background: 'var(--color-surface-2)',
                  borderRadius: '4px',
                }}>
                  <input
                    type="checkbox"
                    checked={st.isDone}
                    onChange={() => handleToggleSubtask(st._id, st.isDone)}
                    style={{ cursor: 'pointer', accentColor: 'var(--color-jade)', width: '16px', height: '16px' }}
                  />
                  <span style={{
                    flex: 1,
                    fontSize: '13px',
                    color: st.isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                    textDecoration: st.isDone ? 'line-through' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {st.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(st._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '0 4px',
                      opacity: 0.6,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-urgent)'; }}
                    onMouseOut={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input
                  placeholder="Add subtask..."
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(); }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--color-primary)',
                    color: '#000',
                    border: '2px solid #000',
                    boxShadow: '2px 2px 0px #000',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: newSubtaskTitle.trim() ? 'pointer' : 'not-allowed',
                    opacity: newSubtaskTitle.trim() ? 1 : 0.5,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase'
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* ─── Attachments Tab ─────────────────────────────────────────── */}
          {activeTab === 'attachments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(!task.attachments || task.attachments.length === 0) && (
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '8px 0' }}>No attachments yet</div>
              )}
              {task.attachments?.map(att => {
                const canDelete = isFounder || att.uploadedBy?._id === user?._id || att.uploadedBy === user?._id;
                return (
                  <div key={att._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'var(--color-surface-2)',
                    borderRadius: '4px',
                  }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>{getFileIcon(att.fileType)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                          fontWeight: 500,
                          textDecoration: 'none',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--color-jade)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                      >
                        {att.fileName}
                      </a>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {formatFileSize(att.fileSize)} · {att.uploadedBy?.name || 'Unknown'} · {formatRelative(att.uploadedAt)}
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteAttachment(att._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          padding: '0 4px',
                          opacity: 0.6,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-urgent)'; }}
                        onMouseOut={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: '8px 16px',
                  background: 'var(--color-primary)',
                  color: '#000',
                  border: '2px solid #000',
                  boxShadow: '2px 2px 0px #000',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1,
                  alignSelf: 'flex-start',
                  marginTop: '4px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Paperclip size={16} /> {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          )}

          {/* ─── Comments Tab ────────────────────────────────────────────── */}
          {activeTab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedComments.length === 0 && (
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '8px 0' }}>No comments yet</div>
              )}
              {sortedComments.map(c => {
                const canDelete = isFounder || c.author?._id === user?._id || c.author === user?._id;
                return (
                  <div key={c._id} style={{
                    padding: '10px 12px',
                    background: 'var(--color-surface-2)',
                    borderRadius: '4px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ color: 'var(--color-text-primary)', flex: 1 }}>{c.text}</div>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '0 4px',
                            flexShrink: 0,
                            opacity: 0.6,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-urgent)'; }}
                          onMouseOut={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      {c.author?.name || 'Unknown'} · {formatRelative(c.createdAt)}
                    </div>
                  </div>
                );
              })}
              <textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                style={{
                  padding: '8px 16px',
                  background: 'var(--color-primary)',
                  color: '#000',
                  border: '2px solid #000',
                  boxShadow: '2px 2px 0px #000',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  opacity: commentText.trim() ? 1 : 0.5,
                  alignSelf: 'flex-start',
                  textTransform: 'uppercase'
                }}
              >
                Add Comment
              </button>
            </div>
          )}
        </div>

        {/* Activity (formerly Notes) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={LABEL}>Activity</div>
          {sortedNotes.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No activity yet</div>
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
              background: 'var(--color-primary)',
              color: '#000',
              border: '2px solid #000',
              boxShadow: '2px 2px 0px #000',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: noteText.trim() ? 'pointer' : 'not-allowed',
              opacity: noteText.trim() ? 1 : 0.5,
              alignSelf: 'flex-start',
              textTransform: 'uppercase'
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
          <div style={{ display: 'flex', gap: '10px', borderTop: '2px solid #000', paddingTop: '16px' }}>
            {isEditing ? (
              <>
                <button onClick={handleSaveEdit} disabled={saving} style={{ padding: '8px 16px', background: 'var(--color-primary)', color: '#000', border: '2px solid #000', boxShadow: '2px 2px 0px #000', borderRadius: '4px', fontWeight: 800, cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', background: 'var(--color-surface-2)', border: '2px solid #000', boxShadow: '2px 2px 0px #000', color: 'var(--color-text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} style={{ padding: '8px 16px', background: 'var(--color-surface-2)', border: '2px solid #000', boxShadow: '2px 2px 0px #000', color: 'var(--color-text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>
                Edit
              </button>
            )}

            {confirmDelete ? (
              <>
                <button onClick={handleDelete} style={{ padding: '8px 16px', background: 'var(--color-urgent)', color: '#000', border: '2px solid #000', boxShadow: '2px 2px 0px #000', borderRadius: '4px', fontWeight: 800, cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase' }}>
                  Confirm Delete
                </button>
                <button onClick={() => setConfirmDelete(false)} style={{ padding: '8px 16px', background: 'var(--color-surface-2)', border: '2px solid #000', boxShadow: '2px 2px 0px #000', color: 'var(--color-text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{ padding: '8px 16px', background: 'var(--color-urgent)', border: '2px solid #000', boxShadow: '2px 2px 0px #000', color: '#000', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 800, marginLeft: 'auto', textTransform: 'uppercase' }}>
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
