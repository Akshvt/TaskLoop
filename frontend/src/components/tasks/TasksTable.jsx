import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';

const getDeadlineDisplay = (task) => {
  if (task.status === 'Done' && task.completedAt && new Date(task.completedAt) > new Date(task.deadline)) {
    return { text: 'Submitted late', color: '#F4A836' }; // Orange warning color
  }

  const diff = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { text: `${Math.abs(diff)}d overdue`, color: '#EF4444' };
  if (diff === 0) return { text: 'Due today',                 color: '#F4A836' };
  if (diff <= 2)  return { text: `${diff}d left`,            color: '#F4A836' };
  return           { text: `${diff}d left`,                   color: '#8B8FA8' };
};

const isOverdue   = (task) => new Date(task.deadline) < new Date() && task.status !== 'Done';
const isDueSoon   = (task) => {
  const now   = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  return new Date(task.deadline) >= now && new Date(task.deadline) <= in48h && task.status !== 'Done';
};

const COL_STYLE = {
  padding: '14px 16px',
  verticalAlign: 'middle',
  fontSize: '14px',
  fontFamily: '"Inter", sans-serif',
};

export default function TasksTable({ tasks, onRowClick }) {
  if (tasks.length === 0) {
    return (
      <div style={{ color: 'var(--color-text-muted)', padding: '48px', textAlign: 'center' }}>
        No tasks found
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
            {['Task', 'Assigned To', 'Deadline', 'Priority', 'Status'].map(h => (
              <th key={h} style={{
                ...COL_STYLE,
                textAlign: 'left',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
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
          {tasks.map((task, index) => {
            const overdue  = isOverdue(task);
            const dueSoon  = isDueSoon(task);
            const done     = task.status === 'Done';
            const deadline = getDeadlineDisplay(task);

            let rowBg = 'transparent';
            if (overdue) rowBg = 'rgba(239,68,68,0.06)';
            else if (dueSoon) rowBg = 'rgba(244,168,54,0.06)';

            return (
              <tr
                key={task._id}
                onClick={() => onRowClick(task)}
                style={{
                  background: rowBg,
                  borderBottom: index < tasks.length - 1 ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer',
                  opacity: done ? 0.6 : 1,
                  transition: 'background 0.15s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-jade-dim)'; }}
                onMouseOut={(e)  => { e.currentTarget.style.background = rowBg; }}
              >
                <td style={{ ...COL_STYLE, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {task.title}
                </td>
                <td style={{ ...COL_STYLE, color: 'var(--color-text-muted)' }}>
                  {task.assignedTo?.name || '—'}
                </td>
                <td style={{ ...COL_STYLE, color: deadline.color, fontWeight: 500 }}>
                  {deadline.text}
                </td>
                <td style={COL_STYLE}>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td style={COL_STYLE}>
                  <StatusBadge status={task.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
