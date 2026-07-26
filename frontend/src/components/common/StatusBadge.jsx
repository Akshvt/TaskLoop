const STATUS_STYLES = {
  'To Do':      { color: '#4F8EF7', bg: 'rgba(79,142,247,0.12)' },
  'In Progress':{ color: '#F4A836', bg: 'rgba(244,168,54,0.12)' },
  'Done':       { color: '#00C896', bg: 'rgba(0,200,150,0.12)' },
  'Blocked':    { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] || { color: '#8B8FA8', bg: 'rgba(139,143,168,0.12)' };

  return (
    <span style={{
      display: 'inline-block',
      borderRadius: '12px',
      padding: '4px 10px',
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: styles.color,
      background: styles.bg,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}
