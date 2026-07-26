import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [totalTasks, setTotalTasks] = useState(0);
  const [doneThisWeek, setDoneThisWeek] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [dueSoonTasks, setDueSoonTasks] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tasksRes, overdueRes, dueSoonRes] = await Promise.all([
          api.get('/api/tasks'),
          api.get('/api/tasks/overdue'),
          api.get('/api/tasks/due-soon')
        ]);

        const allTasks = tasksRes.data;
        setTotalTasks(allTasks.length);

        // Calculate done this week (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const doneCount = allTasks.filter(task => {
          if (task.status !== 'Done') return false;
          const updatedDate = new Date(task.lastUpdated);
          return updatedDate >= sevenDaysAgo;
        }).length;
        
        setDoneThisWeek(doneCount);

        setOverdueTasks(overdueRes.data);
        setDueSoonTasks(dueSoonRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const daysBetween = (date) =>
    Math.ceil((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));

  const StatCard = ({ title, value, color }) => (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderLeft: `4px solid ${color}`,
      borderRadius: '8px',
      padding: '24px',
      flex: 1,
      minWidth: '200px'
    }}>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ color: 'var(--color-text-primary)', fontSize: '28px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        {value}
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ color: 'var(--color-text-muted)' }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <h1 style={{
        margin: 0,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 700,
        fontSize: '24px',
        color: 'var(--color-text-primary)'
      }}>
        Good morning, {user?.name.split(' ')[0]} 👋
      </h1>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <StatCard title="Total Tasks" value={totalTasks} color="var(--color-jade)" />
        <StatCard title="Overdue" value={overdueTasks.length} color="var(--color-red)" />
        <StatCard title="Due Soon" value={dueSoonTasks.length} color="var(--color-amber, var(--color-saffron))" />
        <StatCard title="Done This Week" value={doneThisWeek} color="var(--color-jade)" />
      </div>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* OVERDUE LIST */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{
            margin: 0,
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            color: 'var(--color-red)'
          }}>
            Overdue Tasks
          </h2>
          
          {overdueTasks.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No overdue tasks. Great job!</div>
          ) : (
            overdueTasks.map(task => {
              const daysOver = daysBetween(task.deadline);
              return (
                <div
                  key={task._id}
                  onClick={() => navigate('/tasks')}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderLeft: '4px solid var(--color-red)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                >
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{task.title}</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    {task.assignedTo?.name} · <span style={{ color: 'var(--color-red)' }}>{daysOver} day{daysOver !== 1 ? 's' : ''} overdue</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* DUE SOON LIST */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{
            margin: 0,
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            color: 'var(--color-amber, var(--color-saffron))'
          }}>
            Due in 48 Hours
          </h2>
          
          {dueSoonTasks.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No tasks due soon.</div>
          ) : (
            dueSoonTasks.map(task => {
              const daysLeft = -daysBetween(task.deadline);
              const relativeTime = daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
              
              return (
                <div
                  key={task._id}
                  onClick={() => navigate('/tasks')}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderLeft: '4px solid var(--color-amber, var(--color-saffron))',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                >
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{task.title}</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    {task.assignedTo?.name} · <span style={{ color: 'var(--color-amber, var(--color-saffron))' }}>{relativeTime}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  );
}
