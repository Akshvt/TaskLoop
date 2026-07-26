import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import TasksTable from '../components/tasks/TasksTable';
import TaskDrawer from '../components/tasks/TaskDrawer';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import { useSearchParams } from 'react-router-dom';

const SELECT_STYLE = {
  padding: '8px 12px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  cursor: 'pointer',
  outline: 'none',
};

export default function TasksPage() {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';
  const [searchParams] = useSearchParams();

  const [tasks, setTasks]             = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [loading, setLoading]         = useState(true);

  // Filter state
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterEmployee, setFilterEmployee]   = useState(searchParams.get('assignedTo') || '');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterPriority, setFilterPriority]   = useState('');

  const debounceTimer = useRef(null);

  const handleSearchChange = (value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEmployee) params.assignedTo = filterEmployee;
      if (filterStatus)   params.status     = filterStatus;
      if (filterPriority) params.priority   = filterPriority;
      const res = await api.get('/api/tasks', { params });
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filterEmployee, filterStatus, filterPriority]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (isFounder) {
      api.get('/api/users').then(res => setEmployees(res.data)).catch(console.error);
    }
  }, [isFounder]);

  const filteredTasks = debouncedSearch
    ? tasks.filter(t => t.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : tasks;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{
          margin: 0,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 700,
          fontSize: '24px',
          color: 'var(--color-text-primary)',
        }}>
          {isFounder ? 'All Tasks' : 'My Tasks'}
        </h1>
        {isFounder && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 18px',
              background: 'var(--color-jade)',
              color: '#0D1117',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Create Task
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            ...SELECT_STYLE,
            minWidth: '220px',
            flex: 1,
          }}
        />
        {isFounder && (
          <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} style={SELECT_STYLE}>
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e._id} value={e._id}>{e.name}</option>
            ))}
          </select>
        )}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={SELECT_STYLE}>
          <option value="">All Statuses</option>
          <option>To Do</option>
          <option>In Progress</option>
          <option>Done</option>
          <option>Blocked</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={SELECT_STYLE}>
          <option value="">All Priorities</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: 'var(--color-text-muted)' }}>Loading tasks...</div>
      ) : (
        <TasksTable tasks={filteredTasks} onRowClick={setSelectedTask} />
      )}

      {/* Task Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
            setSelectedTask(updatedTask);
          }}
          onDelete={(id) => {
            setTasks(prev => prev.filter(t => t._id !== id));
            setSelectedTask(null);
          }}
          employees={employees}
        />
      )}

      {/* Create Task Modal */}
      {showModal && (
        <CreateTaskModal
          employees={employees}
          onClose={() => setShowModal(false)}
          onCreated={(newTask) => {
            setTasks(prev => [newTask, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
