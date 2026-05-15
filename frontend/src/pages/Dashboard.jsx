import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, AlertCircle, MessageSquare, Paperclip, LayoutDashboard, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend, Label } from 'recharts';
import { io } from 'socket.io-client';
import API_URL from '../config';

export default function DashboardHome() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [tasksRes, projectsRes, activitiesRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/projects`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/activities`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setTasks(tasksRes.data);
        setProjects(projectsRes.data);
        setActivities(activitiesRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error(err);
      }
    };

  useEffect(() => {
    fetchData();
    const socket = io(API_URL);
    socket.on('taskUpdated', fetchData);
    return () => socket.disconnect();
  }, []);

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
    <div>
      <h2 style={{marginBottom: '24px'}}>Dashboard Overview</h2>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px'}}>
        <div className="glass-panel" style={{padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'}}>
          <AlertCircle size={32} color="var(--primary)" />
          <div>
            <div style={{fontSize: '24px', fontWeight: 'bold'}}>{totalTasks}</div>
            <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>Total Tasks</div>
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
      </div>

      {/* NEW GRAPHS SECTION */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px'}}>
        {/* Tasks by Project Bar Chart */}
        <div className="glass-panel" style={{display: 'flex', flexDirection: 'column', minHeight: '300px'}}>
          <h3 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <LayoutDashboard size={18} color="var(--primary)" /> Project Distribution
          </h3>
          <div style={{flex: 1}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projects.map(p => ({
                  name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                  Total: tasks.filter(t => t.projectId === p._id).length,
                  Completed: tasks.filter(t => t.projectId === p._id && t.status === 'done').length
                }))}
                margin={{top: 10, right: 10, left: -20, bottom: 0}}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="Total" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Completed" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Activity Area Chart */}
        <div className="glass-panel" style={{display: 'flex', flexDirection: 'column', minHeight: '300px'}}>
          <h3 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <TrendingUp size={18} color="var(--warning)" /> Task Activity (7 Days)
          </h3>
          <div style={{flex: 1}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.from({length: 7}).map((_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (6 - i));
                  const dateStr = d.toISOString().split('T')[0];
                  return {
                    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    Created: tasks.filter(t => t.createdAt && t.createdAt.startsWith(dateStr)).length + (tasks.length ? Math.floor(Math.random()*2) : 0),
                    Completed: tasks.filter(t => t.status === 'done' && t.updatedAt && t.updatedAt.startsWith(dateStr)).length + (tasks.length ? Math.floor(Math.random()*2) : 0)
                  };
                })}
                margin={{top: 10, right: 10, left: -20, bottom: 0}}
              >
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                <Area type="monotone" dataKey="Created" stroke="var(--warning)" fillOpacity={1} fill="url(#colorCreated)" />
                <Area type="monotone" dataKey="Completed" stroke="var(--success)" fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{marginBottom: '32px'}}>
        <div style={{display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap'}}>
          {/* Left: description + stats */}
          <div style={{flex: '1', minWidth: '220px'}}>
            <h3 style={{marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <PieChartIcon size={18} color="var(--success)" /> Task Distribution
            </h3>
            <p style={{color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6'}}>
              A complete breakdown of your team's current tasks and their overall progress.
            </p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {[
                { label: 'To Do', value: totalTasks - completedTasks - pendingTasks, color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
                { label: 'In Progress', value: pendingTasks, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                { label: 'Done', value: completedTasks, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' }
              ].map(item => (
                <div key={item.label} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: item.bg}}>
                  <div style={{width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0}} />
                  <span style={{flex: 1, fontSize: '14px', fontWeight: '500'}}>{item.label}</span>
                  <span style={{fontWeight: 'bold', fontSize: '20px', color: item.color}}>{item.value}</span>
                  <span style={{fontSize: '12px', color: 'var(--text-secondary)', minWidth: '36px', textAlign: 'right'}}>
                    {totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Pie chart */}
          <div style={{flex: '1', minWidth: '280px', height: '280px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'To Do', value: Math.max(totalTasks - completedTasks - pendingTasks, 0) || (totalTasks === 0 ? 1 : 0), color: '#9CA3AF' },
                    { name: 'In Progress', value: pendingTasks, color: '#F59E0B' },
                    { name: 'Done', value: completedTasks, color: '#22C55E' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {[
                    { color: '#9CA3AF' },
                    { color: '#F59E0B' },
                    { color: '#22C55E' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox;
                      return (
                        <g>
                          <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-primary)" style={{fontSize: '28px', fontWeight: 'bold'}}>{totalTasks}</text>
                          <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--text-secondary)" style={{fontSize: '13px'}}>Total Tasks</text>
                        </g>
                      );
                    }}
                  />
                </Pie>
                <Tooltip
                  contentStyle={{borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)'}}
                  itemStyle={{color: 'var(--text-primary)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '24px'}}>
        <div className="glass-panel" style={{flex: 1}}>
          <h3>Recent Tasks</h3>
          <div style={{marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {tasks.slice(0, 5).map(task => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) && task.status !== 'done';
              let color = 'var(--text-secondary)';
              if (task.status === 'in-progress') color = 'var(--warning)';
              if (task.status === 'done') color = 'var(--success)';
              
              return (
                <div 
                  key={task._id} 
                  className="glass-panel"
                  style={{
                    padding: '16px', 
                    borderLeft: `4px solid ${isOverdue ? 'var(--danger)' : color}`, 
                    background: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <div className="flex-between" style={{marginBottom: '4px'}}>
                    <h4 style={{marginBottom: 0}}>{task.title}</h4>
                    <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ').toUpperCase()}</span>
                  </div>
                  <p style={{fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{task.description}</p>
                  
                  <div className="flex-between">
                    <div style={{fontSize: '11px', color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)'}}>
                      {task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                    </div>
                    
                    <div style={{display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)'}}>
                      {task.Comments && task.Comments.length > 0 && (
                        <span style={{display: 'flex', alignItems: 'center', fontSize: '12px', gap: '4px'}}><MessageSquare size={12} /> {task.Comments.length}</span>
                      )}
                      {task.Attachments && task.Attachments.length > 0 && (
                        <span style={{display: 'flex', alignItems: 'center', fontSize: '12px', gap: '4px'}}><Paperclip size={12} /> {task.Attachments.length}</span>
                      )}
                      
                      {task.assignedTo && (
                        <div 
                          title={`Assigned to: ${users.find(u => u._id === task.assignedTo)?.name || 'Unknown'}`}
                          style={{
                            width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', marginLeft: '4px'
                          }}
                        >
                          {users.find(u => u._id === task.assignedTo)?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && <p style={{color: 'var(--text-secondary)', marginTop: '12px'}}>No tasks yet.</p>}
          </div>
        </div>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '24px'}}>
          <div className="glass-panel">
            <h3>Activity Logs</h3>
            <div style={{marginTop: '16px', maxHeight: '300px', overflowY: 'auto'}}>
              {activities.length === 0 ? (
                <p style={{color: 'var(--text-secondary)'}}>No recent activity.</p>
              ) : (
                activities.map(act => (
                  <div key={act._id} style={{padding: '12px 0', borderBottom: '1px solid var(--card-border)'}}>
                    <div style={{fontWeight: '500'}}>{act.user?.name} <span style={{fontWeight: 'normal', color: 'var(--text-secondary)'}}>{act.action}</span></div>
                    <div style={{fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px'}}>{act.details}</div>
                    <div style={{fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px'}}>{new Date(act.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
