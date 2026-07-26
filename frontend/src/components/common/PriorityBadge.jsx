const PRIORITY_STYLES = {
  'High':   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  'Medium': { color: '#F4A836', bg: 'rgba(244,168,54,0.12)' },
  'Low':    { color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

export default function PriorityBadge({ priority }) {
  const styles = PRIORITY_STYLES[priority] || { color: '#8B8FA8', bg: 'rgba(139,143,168,0.12)' };

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
      {priority}
    </span>
  );
}
