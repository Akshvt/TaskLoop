import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { useToast } from '../common/Toast';
import { useState } from 'react';

const getDeadlineDisplay = (task) => {
  if (task.status === 'Done' && task.completedAt && new Date(task.completedAt) > new Date(task.deadline)) {
    return { text: 'Submitted late', color: 'var(--color-saffron)' };
  }

  const diff = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { text: `${Math.abs(diff)}d overdue`, color: 'var(--color-urgent)' };
  if (diff === 0) return { text: 'Due today',                 color: 'var(--color-saffron)' };
  if (diff <= 2)  return { text: `${diff}d left`,            color: 'var(--color-saffron)' };
  return           { text: `${diff}d left`,                   color: 'var(--color-text-muted)' };
};

const isOverdue   = (task) => new Date(task.deadline) < new Date() && task.status !== 'Done';
const isDueSoon   = (task) => {
  const now   = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  return new Date(task.deadline) >= now && new Date(task.deadline) <= in48h && task.status !== 'Done';
};

const COL_STYLE = {
  padding: '16px',
  verticalAlign: 'middle',
  fontSize: '14px',
  fontFamily: '"Inter", sans-serif',
};

const STATUS_ORDER = ['To Do', 'In Progress', 'Blocked', 'Done'];

export default function TasksTable({ tasks, onRowClick }) {
  const { user } = useAuth();
  const addToast = useToast();
  const isFounder = user?.role === 'founder';
  const [sendingReminderId, setSendingReminderId] = useState(null);
  
  // Collapse state for groups
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (status) => {
    setCollapsedGroups(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const handleSendReminder = async (e, task) => {
    e.stopPropagation();
    setSendingReminderId(task._id);
    try {
      await api.post(`/api/tasks/${task._id}/remind`);
      addToast(`Reminder sent to ${task.assignedTo?.name || 'assignee'}`, 'success');
    } catch (err) {
      console.error('Failed to send reminder', err);
      addToast('Failed to send reminder', 'error');
    } finally {
      setSendingReminderId(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <div style={{ color: 'var(--color-text-muted)', padding: '48px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--neo-border-radius)', border: 'var(--neo-border)', boxShadow: 'var(--neo-shadow)', fontWeight: 600 }}>
        No tasks found
      </div>
    );
  }

  // Group tasks
  const groupedTasks = STATUS_ORDER.map(status => ({
    status,
    items: tasks.filter(t => t.status === status)
  })).filter(g => g.items.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {groupedTasks.map(group => {
        const isCollapsed = collapsedGroups[group.status];
        return (
          <div key={group.status} style={{
            background: 'var(--color-surface)',
            border: 'var(--neo-border)',
            borderRadius: 'var(--neo-border-radius)',
            boxShadow: 'var(--neo-shadow)',
            overflow: 'hidden',
          }}>
            <div 
              onClick={() => toggleGroup(group.status)}
              style={{
                padding: '16px 20px',
                background: 'var(--color-surface)',
                borderBottom: isCollapsed ? 'none' : 'var(--neo-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)', 
                  transition: 'transform 0.2s',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px',
                  fontWeight: 800
                }}>▼</span>
                <h3 style={{ 
                  margin: 0, 
                  fontFamily: '"Plus Jakarta Sans", sans-serif', 
                  fontSize: '18px', 
                  fontWeight: 800,
                  color: 'var(--color-text-primary)' 
                }}>
                  {group.status} <span style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginLeft: '8px', fontWeight: 700 }}>{group.items.length}</span>
                </h3>
              </div>
            </div>

            {!isCollapsed && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-2)', borderBottom: 'var(--neo-border)' }}>
                    {['Task', 'Assignee', 'Deadline', 'Priority', 'Progress', ...(isFounder ? ['Actions'] : [])].map(h => (
                      <th key={h} style={{
                        ...COL_STYLE,
                        textAlign: 'left',
                        color: 'var(--color-text-primary)',
                        fontWeight: 800,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((task, index) => {
                    const overdue  = isOverdue(task);
                    const done     = task.status === 'Done';
                    const deadline = getDeadlineDisplay(task);

                    let rowBg = 'transparent';
                    if (overdue) rowBg = 'color-mix(in srgb, var(--color-urgent) 6%, transparent)';

                    return (
                      <tr
                        key={task._id}
                        onClick={() => onRowClick(task)}
                        style={{
                          background: rowBg,
                          borderBottom: index < group.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                          cursor: 'pointer',
                          opacity: done ? 0.7 : 1,
                          transition: 'background 0.15s',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                        onMouseOut={(e)  => { e.currentTarget.style.background = rowBg; }}
                      >
                        {/* Task Title */}
                        <td style={{ ...COL_STYLE, color: 'var(--color-text-primary)', fontWeight: 700 }}>
                          {task.title}
                        </td>
                        
                        {/* Assignee Avatar */}
                        <td style={{ ...COL_STYLE, color: 'var(--color-text-muted)' }}>
                          {task.assignedTo ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '26px', height: '26px', borderRadius: '4px', background: 'var(--color-primary)', color: '#000',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, border: '2px solid #000'
                              }}>
                                {task.assignedTo.name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{task.assignedTo.name}</span>
                            </div>
                          ) : '—'}
                        </td>

                        {/* Deadline */}
                        <td style={{ ...COL_STYLE, color: deadline.color, fontWeight: 700, fontSize: '13px' }}>
                          {deadline.text}
                        </td>

                        {/* Priority */}
                        <td style={COL_STYLE}>
                          <PriorityBadge priority={task.priority} />
                        </td>

                        {/* Progress */}
                        <td style={COL_STYLE}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, height: '8px', background: 'var(--color-progress-track)', borderRadius: '4px', overflow: 'hidden', border: '1px solid #000' }}>
                              <div style={{ width: `${task.progress || 0}%`, height: '100%', background: 'var(--color-progress-fill)', borderRadius: '2px' }} />
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', minWidth: '32px', fontWeight: 700 }}>
                              {task.progress || 0}%
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        {isFounder && (
                          <td style={COL_STYLE}>
                            {overdue ? (
                              <button
                                onClick={(e) => handleSendReminder(e, task)}
                                disabled={sendingReminderId === task._id}
                                style={{
                                  background: 'var(--color-urgent)',
                                  border: '2px solid #000',
                                  color: '#000',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: sendingReminderId === task._id ? 'not-allowed' : 'pointer',
                                  opacity: sendingReminderId === task._id ? 0.5 : 1,
                                  transition: 'all 0.1s',
                                  boxShadow: '2px 2px 0px #000',
                                  textTransform: 'uppercase'
                                }}
                                onMouseDown={e => { if (sendingReminderId !== task._id) { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px #000'; } }}
                                onMouseUp={e => { if (sendingReminderId !== task._id) { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0px #000'; } }}
                              >
                                {sendingReminderId === task._id ? 'Sending...' : 'Remind'}
                              </button>
                            ) : (
                              <div style={{ color: 'var(--color-text-primary)', fontSize: '18px', padding: '4px', fontWeight: 800 }}>⋮</div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
