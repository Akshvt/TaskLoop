const STATUS_COLORS = {
  'To Do':      'var(--color-status-todo)',
  'In Progress':'var(--color-status-inprogress)',
  'Done':       'var(--color-status-done)',
  'Blocked':    'var(--color-status-blocked)',
};

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || 'var(--color-text-muted)';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--neo-border-radius)',
      padding: '4px 10px',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 800,
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#000',
      background: color,
      border: '2px solid #000',
      boxShadow: '2px 2px 0px #000',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}
