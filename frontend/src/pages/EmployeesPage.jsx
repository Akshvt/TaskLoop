import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const COL = {
  padding: '14px 16px',
  fontSize: '14px',
  fontFamily: '"Inter", sans-serif',
  verticalAlign: 'middle',
};

const TH = {
  ...COL,
  color: 'var(--color-text-muted)',
  fontWeight: 600,
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
  background: 'var(--color-surface-2)',
};

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, tasksRes] = await Promise.all([
          api.get('/api/users'),
          api.get('/api/tasks'),
        ]);
        setEmployees(usersRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        console.error('Failed to fetch employees data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();

  const getEmployeeStats = (employeeId) => {
    const employeeTasks = tasks.filter(t => t.assignedTo?._id === employeeId || t.assignedTo === employeeId);
    const overdueCount  = employeeTasks.filter(t => new Date(t.deadline) < now && t.status !== 'Done').length;
    return { total: employeeTasks.length, overdue: overdueCount };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{
        margin: 0,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 700,
        fontSize: '24px',
        color: 'var(--color-text-primary)',
      }}>
        Employees
      </h1>

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : employees.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)' }}>No employees registered yet.</div>
      ) : (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={TH}>Name</th>
                <th style={TH}>Email</th>
                <th style={TH}>Total Tasks</th>
                <th style={TH}>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => {
                const { total, overdue } = getEmployeeStats(emp._id);
                return (
                  <tr
                    key={emp._id}
                    onClick={() => navigate(`/tasks?assignedTo=${emp._id}`)}
                    style={{
                      borderBottom: index < employees.length - 1 ? '1px solid var(--color-border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--color-jade-dim)'}
                    onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...COL, color: 'var(--color-text-primary)', fontWeight: 500 }}>{emp.name}</td>
                    <td style={{ ...COL, color: 'var(--color-text-muted)' }}>{emp.email}</td>
                    <td style={{ ...COL, color: 'var(--color-text-primary)' }}>{total}</td>
                    <td style={{ ...COL, color: overdue > 0 ? 'var(--color-red)' : 'var(--color-text-muted)', fontWeight: overdue > 0 ? 600 : 400 }}>
                      {overdue > 0 ? overdue : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
