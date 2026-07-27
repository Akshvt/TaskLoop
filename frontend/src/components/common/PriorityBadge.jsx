const PRIORITY_COLORS = {
  'High':   'var(--color-priority-high)',
  'Medium': 'var(--color-priority-medium)',
  'Low':    'var(--color-priority-low)',
};

const PRIORITY_NUMBERS = {
  'High':   'P1',
  'Medium': 'P2',
  'Low':    'P3',
};

export default function PriorityBadge({ priority, variant = 'text' }) {
  const color = PRIORITY_COLORS[priority] || 'var(--color-text-muted)';
  const display = variant === 'number' ? PRIORITY_NUMBERS[priority] || priority : priority;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--neo-border-radius)',
      padding: variant === 'number' ? '4px 6px' : '4px 10px',
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
      {display}
    </span>
  );
}
