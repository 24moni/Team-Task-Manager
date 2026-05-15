import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { LogOut, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function Dashboard({ user, setUser }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Forms
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', dueDate: '' });

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const projectIdParam = activeProject ? `?projectId=${activeProject._id}` : '';
      const { data } = await axios.get(`${API_URL}/api/tasks${projectIdParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [activeProject]); // Refetch tasks when active project changes

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/projects`, newProject, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowProjectModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating project');
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!activeProject) return alert('Select a project first');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/tasks`, { ...newTask, projectId: activeProject._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', status: 'todo', dueDate: '' });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating task');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/tasks/${taskId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating task');
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in-progress').length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false;
    const taskDate = new Date(t.dueDate);
    return taskDate < today;
  }).length;

  return (
    <>
      <nav className="nav-bar">
        <div className="logo">Team Task Manager</div>
        <div className="flex-between" style={{gap: '16px'}}>
          <span>Welcome, <b>{user.name}</b> ({user.role})</span>
          <button className="btn btn-danger" onClick={handleLogout}><LogOut size={16} /> Logout</button>
        </div>
      </nav>

      <div className="dashboard-grid">
        {/* Sidebar - Projects */}
        <div className="glass-panel" style={{height: 'fit-content'}}>
          <div className="flex-between" style={{marginBottom: '16px'}}>
            <h3>Projects</h3>
            {user.role === 'admin' && (
              <button className="btn" style={{padding: '6px'}} onClick={() => setShowProjectModal(true)}>
                <Plus size={16} />
              </button>
            )}
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div 
              style={{
                padding: '12px', 
                borderRadius: '8px',
                cursor: 'pointer',
                background: !activeProject ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                borderLeft: !activeProject ? '3px solid var(--primary)' : '3px solid transparent'
              }}
              onClick={() => setActiveProject(null)}
            >
              All Tasks
            </div>
            {projects.map(p => (
              <div 
                key={p._id}
                style={{
                  padding: '12px', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: activeProject?._id === p._id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  borderLeft: activeProject?._id === p._id ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'background 0.2s'
                }}
                onClick={() => setActiveProject(p)}
              >
                <div style={{fontWeight: '500'}}>{p.name}</div>
                <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Project ID: {p._id}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Tasks */}
        <div className="glass-panel">
          <div className="flex-between" style={{marginBottom: '24px'}}>
            <div>
              <h2>{activeProject ? activeProject.name : 'All Tasks'}</h2>
              {activeProject && <p style={{color: 'var(--text-secondary)'}}>{activeProject.description}</p>}
            </div>
            {user.role === 'admin' && activeProject && (
              <button className="btn" onClick={() => setShowTaskModal(true)}>
                <Plus size={16} /> New Task
              </button>
            )}
          </div>

          {/* Stats */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px'}}>
            <div className="glass-panel" style={{padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'}}>
              <AlertCircle size={32} color="var(--primary)" />
              <div>
                <div style={{fontSize: '24px', fontWeight: 'bold'}}>{totalTasks}</div>
                <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>Total</div>
              </div>
            </div>
            <div className="glass-panel" style={{padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'}}>
              <CheckCircle size={32} color="var(--success)" />
              <div>
                <div style={{fontSize: '24px', fontWeight: 'bold'}}>{completedTasks}</div>
                <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>Completed</div>
              </div>
            </div>
            <div className="glass-panel" style={{padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'}}>
              <Clock size={32} color="var(--warning)" />
              <div>
                <div style={{fontSize: '24px', fontWeight: 'bold'}}>{pendingTasks}</div>
                <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>Pending</div>
              </div>
            </div>
            <div className="glass-panel" style={{padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: overdueTasks > 0 ? '4px solid var(--danger)' : 'none'}}>
              <AlertCircle size={32} color={overdueTasks > 0 ? "var(--danger)" : "var(--text-secondary)"} />
              <div>
                <div style={{fontSize: '24px', fontWeight: 'bold', color: overdueTasks > 0 ? "var(--danger)" : "inherit"}}>{overdueTasks}</div>
                <div style={{fontSize: '14px', color: overdueTasks > 0 ? "var(--danger)" : "var(--text-secondary)"}}>Overdue</div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {tasks.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-secondary)'}}>
                No tasks found.
              </div>
            ) : (
              tasks.map(task => (
                <div key={task._id} className="glass-panel task-card" style={{padding: '16px', borderLeftColor: task.status === 'done' ? 'var(--success)' : task.status === 'in-progress' ? 'var(--warning)' : 'var(--primary)'}}>
                  <div className="flex-between">
                    <h4 style={{marginBottom: '8px'}}>{task.title}</h4>
                    <span className={`badge badge-${task.status}`}>
                      {task.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p style={{color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px'}}>{task.description}</p>
                  
                  <div className="flex-between">
                    <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
                      Project ID: {task.projectId} 
                      {task.dueDate && <span style={{marginLeft: '12px'}}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                    
                    <select 
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                      style={{width: 'auto', marginBottom: 0, padding: '6px 12px', background: 'rgba(0,0,0,0.3)'}}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showProjectModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div className="glass-panel" style={{width: '100%', maxWidth: '400px'}}>
            <h3>Create Project</h3>
            <form onSubmit={createProject}>
              <input type="text" placeholder="Project Name" required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
              <textarea placeholder="Description" rows={3} value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})}></textarea>
              <div className="flex-between" style={{marginTop: '16px'}}>
                <button type="button" className="btn btn-danger" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div className="glass-panel" style={{width: '100%', maxWidth: '400px'}}>
            <h3>Create Task</h3>
            <form onSubmit={createTask}>
              <input type="text" placeholder="Task Title" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              <textarea placeholder="Description" rows={3} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
              <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} style={{marginTop: '8px'}} />
              <div className="flex-between" style={{marginTop: '16px'}}>
                <button type="button" className="btn btn-danger" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
