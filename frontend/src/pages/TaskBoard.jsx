import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, MessageSquare, Paperclip, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import API_URL from '../config';

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeProject, setActiveProject] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(null);
  const [isEditingTask, setIsEditingTask] = useState(false);

  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', dueDate: '', projectId: '', assignedTo: '' });
  const [newComment, setNewComment] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
      if (projectsRes.data.length > 0 && !activeProject) {
        setActiveProject(projectsRes.data[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load task board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = io(API_URL);
    socket.on('taskUpdated', fetchData);
    return () => socket.disconnect();
  }, []);

  const createTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/tasks`, { ...newTask, projectId: activeProject }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', status: 'todo', dueDate: '', projectId: '', assignedTo: '' });
      toast.success('Task created successfully');
      
      const { data } = await axios.get(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Task updated');
    } catch (err) {
      toast.error('Failed to update task status');
      fetchData(); // Revert on failure
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowTaskDetailsModal(null);
      toast.success('Task deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error deleting task');
    }
  };

  const updateTaskDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/tasks/${showTaskDetailsModal._id}`, {
        title: showTaskDetailsModal.title,
        description: showTaskDetailsModal.description,
        dueDate: showTaskDetailsModal.dueDate,
        assignedTo: showTaskDetailsModal.assignedTo,
        status: showTaskDetailsModal.status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditingTask(false);
      toast.success('Task updated');
      fetchData();
    } catch (err) {
      toast.error('Error updating task');
    }
  };

  // Drag and Drop Handlers
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistically update UI
    const updatedTasks = Array.from(tasks);
    const taskIndex = updatedTasks.findIndex(t => t._id.toString() === draggableId);
    if (taskIndex > -1) {
      updatedTasks[taskIndex].status = destination.droppableId;
      setTasks(updatedTasks);
      updateTaskStatus(draggableId, destination.droppableId);
    }
  };

  // Comments and Attachments
  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/tasks/${showTaskDetailsModal._id}/comments`, { text: newComment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewComment('');
      toast.success('Comment added');
      fetchData();
    } catch (err) {
      toast.error('Error adding comment');
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);

      await axios.post(`${API_URL}/api/tasks/${showTaskDetailsModal._id}/attachments`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setSelectedFile(null);
      toast.success('File attached');
      fetchData();
    } catch (err) {
      toast.error('Error uploading file');
    }
  };

  // Update modal data when tasks update
  useEffect(() => {
    if (showTaskDetailsModal) {
      const updatedTask = tasks.find(t => t._id === showTaskDetailsModal._id);
      if (updatedTask) setShowTaskDetailsModal(updatedTask);
    }
  }, [tasks]);

  const filteredTasks = tasks.filter(t => activeProject === '' || t.projectId == activeProject);

  const renderColumn = (status, title, color, bgGradient, dragOverColor) => {
    const columnTasks = filteredTasks.filter(t => t.status === status);
    
    return (
      <div style={{
        flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column',
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)'
      }}>
        {/* Vibrant Column Header */}
        <div style={{
          background: bgGradient,
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h3 style={{color: '#fff', margin: 0, fontWeight: '700', letterSpacing: '0.02em', fontSize: '15px'}}>
            {title}
          </h3>
          <span style={{
            background: 'rgba(255,255,255,0.25)', color: '#fff',
            borderRadius: '20px', padding: '2px 12px',
            fontSize: '13px', fontWeight: '700'
          }}>{columnTasks.length}</span>
        </div>

        <Droppable droppableId={status}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                display: 'flex', flexDirection: 'column', gap: '12px',
                minHeight: '200px', flex: 1, padding: '14px',
                transition: 'background-color 0.2s ease',
                backgroundColor: snapshot.isDraggingOver ? dragOverColor : 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(8px)'
              }}
            >
              {columnTasks.map((task, index) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) && task.status !== 'done';
                
                return (
                  <Draggable key={task._id} draggableId={task._id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => setShowTaskDetailsModal(task)}
                        title="Click to view details"
                        style={{
                          padding: '14px 16px',
                          borderLeft: `4px solid ${isOverdue ? '#EF4444' : color}`,
                          background: snapshot.isDragging
                            ? `linear-gradient(135deg, #fff 60%, ${color}22)`
                            : '#fff',
                          borderRadius: '10px',
                          boxShadow: snapshot.isDragging
                            ? `0 16px 32px ${color}44`
                            : '0 2px 8px rgba(0,0,0,0.08)',
                          cursor: 'grab',
                          transition: 'box-shadow 0.2s, transform 0.15s',
                          transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                          ...provided.draggableProps.style
                        }}
                      >
                        <h4 style={{marginBottom: '4px', fontSize: '14px', fontWeight: '700', color: '#1e1e2e'}}>{task.title}</h4>
                        <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{task.description}</p>

                        <div className="flex-between">
                          <div style={{fontSize: '11px', color: isOverdue ? '#EF4444' : '#9ca3af', fontWeight: isOverdue ? '700' : '400'}}>
                            {task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                          </div>

                          <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                            {task.Comments && task.Comments.length > 0 && (
                              <span style={{display: 'flex', alignItems: 'center', fontSize: '11px', gap: '3px', color: '#6b7280'}}><MessageSquare size={11} /> {task.Comments.length}</span>
                            )}
                            {task.Attachments && task.Attachments.length > 0 && (
                              <span style={{display: 'flex', alignItems: 'center', fontSize: '11px', gap: '3px', color: '#6b7280'}}><Paperclip size={11} /> {task.Attachments.length}</span>
                            )}
                            {task.assignedTo && (
                              <div
                                title={`Assigned to: ${users.find(u => u._id === task.assignedTo)?.name || 'Unknown'}`}
                                style={{
                                  width: '22px', height: '22px', borderRadius: '50%',
                                  background: color, color: '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '10px', fontWeight: 'bold'
                                }}
                              >
                                {users.find(u => u._id === task.assignedTo)?.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
              {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                <div style={{textAlign: 'center', padding: '28px 20px', fontSize: '13px', color: '#9ca3af', margin: 'auto'}}>
                  Drop tasks here
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div>
      <div className="flex-between" style={{marginBottom: '24px'}}>
        <h2>Task Board</h2>
        <div style={{display: 'flex', gap: '16px'}}>
          <select 
            value={activeProject} 
            onChange={e => setActiveProject(e.target.value)}
            style={{marginBottom: 0, width: '200px'}}
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          {currentUser.role === 'admin' && (
            <button className="btn" onClick={() => setShowTaskModal(true)} disabled={!activeProject}>
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Task Board Graph */}
      {!loading && tasks.length > 0 && (
        <div className="glass-panel" style={{marginBottom: '24px', padding: '16px', height: '180px', display: 'flex', flexDirection: 'column'}}>
          <h4 style={{marginBottom: '8px', color: 'var(--text-secondary)'}}>Status Overview</h4>
          <div style={{flex: 1}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={[
                { name: 'To Do', count: tasks.filter(t => t.status === 'todo').length, color: 'var(--text-secondary)' },
                { name: 'In Progress', count: tasks.filter(t => t.status === 'in-progress').length, color: 'var(--warning)' },
                { name: 'Done', count: tasks.filter(t => t.status === 'done').length, color: 'var(--success)' }
              ]} margin={{top: 0, right: 20, left: 0, bottom: 0}}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-secondary)'}} width={80} />
                <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {[
                    { name: 'To Do',       count: tasks.filter(t => t.status === 'todo').length,        color: '#6366F1' },
                    { name: 'In Progress', count: tasks.filter(t => t.status === 'in-progress').length, color: '#F59E0B' },
                    { name: 'Done',        count: tasks.filter(t => t.status === 'done').length,         color: '#10B981' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{display: 'flex', justifyContent: 'center', padding: '40px'}}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px'}}>
            {renderColumn('todo',        'To Do',       '#6366F1', 'linear-gradient(135deg, #6366F1, #8B5CF6)', 'rgba(99,102,241,0.08)')}
            {renderColumn('in-progress', 'In Progress', '#F59E0B', 'linear-gradient(135deg, #F59E0B, #EF4444)', 'rgba(245,158,11,0.08)')}
            {renderColumn('done',        'Done',        '#10B981', 'linear-gradient(135deg, #10B981, #06B6D4)', 'rgba(16,185,129,0.08)')}
          </div>
        </DragDropContext>
      )}

      {/* Modals with Framer Motion */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel" 
              style={{width: '100%', maxWidth: '400px'}}
            >
              <h3>Create Task</h3>
              <form onSubmit={createTask}>
                <input type="text" placeholder="Task Title" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                <textarea placeholder="Description" rows={3} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
                <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                
                <select value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})} style={{marginTop: '8px'}}>
                  <option value="">Assign to (Optional)</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>

                <div className="flex-between" style={{marginTop: '16px'}}>
                  <button type="button" className="btn btn-danger" onClick={() => setShowTaskModal(false)}>Cancel</button>
                  <button type="submit" className="btn">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTaskDetailsModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel" 
              style={{width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'}}
            >
              <div className="flex-between" style={{marginBottom: '16px'}}>
                {isEditingTask ? (
                  <input 
                    type="text" 
                    value={showTaskDetailsModal.title} 
                    onChange={e => setShowTaskDetailsModal({...showTaskDetailsModal, title: e.target.value})}
                    style={{fontSize: '20px', fontWeight: 'bold', marginBottom: 0, padding: '8px'}}
                  />
                ) : (
                  <h3>{showTaskDetailsModal.title}</h3>
                )}
                <div style={{display: 'flex', gap: '8px'}}>
                  {currentUser.role === 'admin' && (
                    <>
                      {isEditingTask ? (
                        <button className="btn" style={{background: 'var(--success)'}} onClick={updateTaskDetails}>Save</button>
                      ) : (
                        <button className="btn" onClick={() => setIsEditingTask(true)}>Edit</button>
                      )}
                      <button className="btn btn-danger" onClick={() => deleteTask(showTaskDetailsModal._id)}>Delete</button>
                    </>
                  )}
                  <button className="btn btn-danger" style={{background: 'var(--text-secondary)'}} onClick={() => {setShowTaskDetailsModal(null); setIsEditingTask(false);}}>Close</button>
                </div>
              </div>
              
              {isEditingTask ? (
                <textarea 
                  value={showTaskDetailsModal.description} 
                  onChange={e => setShowTaskDetailsModal({...showTaskDetailsModal, description: e.target.value})}
                  rows={4}
                  style={{marginBottom: '16px'}}
                />
              ) : (
                <p style={{color: 'var(--text-secondary)', marginBottom: '16px'}}>{showTaskDetailsModal.description}</p>
              )}
              
              <div style={{marginBottom: '24px', fontSize: '14px', display: 'flex', gap: '24px', alignItems: 'center'}}>
                <div>
                  <strong>Status:</strong> 
                  <select 
                    value={showTaskDetailsModal.status} 
                    onChange={e => {
                      setShowTaskDetailsModal({...showTaskDetailsModal, status: e.target.value});
                      if (!isEditingTask) updateTaskStatus(showTaskDetailsModal._id, e.target.value);
                    }}
                    style={{marginLeft: '8px', padding: '4px 8px', width: 'auto', marginBottom: 0, fontSize: '13px'}}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <strong>Due:</strong> 
                  {isEditingTask ? (
                    <input 
                      type="date" 
                      value={showTaskDetailsModal.dueDate ? showTaskDetailsModal.dueDate.split('T')[0] : ''} 
                      onChange={e => setShowTaskDetailsModal({...showTaskDetailsModal, dueDate: e.target.value})}
                      style={{marginLeft: '8px', padding: '4px 8px', width: 'auto', marginBottom: 0, fontSize: '13px'}}
                    />
                  ) : (
                    <span style={{marginLeft: '8px'}}>{showTaskDetailsModal.dueDate ? new Date(showTaskDetailsModal.dueDate).toLocaleDateString() : 'No date set'}</span>
                  )}
                </div>
                <div>
                  <strong>Assigned:</strong> 
                  {isEditingTask ? (
                    <select 
                      value={showTaskDetailsModal.assignedTo || ''} 
                      onChange={e => setShowTaskDetailsModal({...showTaskDetailsModal, assignedTo: e.target.value})}
                      style={{marginLeft: '8px', padding: '4px 8px', width: 'auto', marginBottom: 0, fontSize: '13px'}}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{marginLeft: '8px'}}>{showTaskDetailsModal.assignedTo ? users.find(u => u._id === showTaskDetailsModal.assignedTo)?.name : 'Unassigned'}</span>
                  )}
                </div>
              </div>

            <div style={{borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginBottom: '24px'}}>
              <h4>Attachments</h4>
              {showTaskDetailsModal.Attachments && showTaskDetailsModal.Attachments.map(att => (
                <div key={att._id} style={{fontSize: '13px', margin: '4px 0'}}>
                  <a href={`${API_URL}/${att.path}`} target="_blank" rel="noreferrer" style={{color: 'var(--primary)', textDecoration: 'none'}}>
                    <Paperclip size={12} /> {att.filename}
                  </a>
                </div>
              ))}
              
              <form onSubmit={uploadFile} style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                <input type="file" onChange={e => setSelectedFile(e.target.files[0])} style={{marginBottom: 0, padding: '8px'}} />
                <button className="btn" type="submit" disabled={!selectedFile}>Upload</button>
              </form>
            </div>

            <div style={{borderTop: '1px solid var(--card-border)', paddingTop: '16px'}}>
              <h4>Comments</h4>
              <div style={{maxHeight: '200px', overflowY: 'auto', marginBottom: '16px'}}>
                {showTaskDetailsModal.Comments && showTaskDetailsModal.Comments.map(c => (
                  <div key={c._id} style={{padding: '8px', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', marginBottom: '8px'}}>
                    <div style={{fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px'}}>
                      {users.find(u => u._id === c.userId)?.name || 'User'} - {new Date(c.createdAt).toLocaleString()}
                    </div>
                    <div style={{fontSize: '14px'}}>{c.text}</div>
                  </div>
                ))}
                {(!showTaskDetailsModal.Comments || showTaskDetailsModal.Comments.length === 0) && (
                  <p style={{fontSize: '13px', color: 'var(--text-secondary)'}}>No comments yet.</p>
                )}
              </div>

              <form onSubmit={addComment} style={{display: 'flex', gap: '8px'}}>
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)}
                  style={{marginBottom: 0}}
                />
                <button type="submit" className="btn" disabled={!newComment.trim()}>Send</button>
              </form>
            </div>
            
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
