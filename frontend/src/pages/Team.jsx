import { useState, useEffect } from 'react';
import axios from 'axios';
import { User as UserIcon, Shield, Mail, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API_URL from '../config';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data);
    } catch (err) { console.error(err); }
  };

  const handleDeleteMember = async (userId, userName) => {
    if (!userId) return;
    if (!window.confirm(`Remove ${userName} from the team?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${userName} removed!`);
      fetchUsers();
    } catch (err) { toast.error('Delete failed'); }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 }}>Team Workspace</h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Manage your experts and administrators</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button 
            className="btn" 
            onClick={() => setShowModal(true)}
            style={{ 
              background: '#2563eb', color: 'white', padding: '10px 20px', 
              borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
              border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
            }}
          >
            <Plus size={18} /> Add New Member
          </button>
        )}
      </div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {users.map(u => {
          const targetId = u.id || u._id;
          const isAdmin = u.role?.toLowerCase() === 'admin';
          
          return (
            <div 
              key={targetId} 
              className="glass-panel" 
              style={{
                background: 'white', borderRadius: '20px', padding: '24px',
                position: 'relative', border: '1px solid #e2e8f0',
                transition: 'transform 0.2s', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
              }}
            >
              {/* Stylish Delete Button */}
              {currentUser?.role === 'admin' && (currentUser.id || currentUser._id) !== targetId && (
                <button 
                  onClick={() => handleDeleteMember(targetId, u.name)}
                  style={{
                    position: 'absolute', top: '16px', right: '16px',
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: '#fef2f2', border: 'none', color: '#ef4444', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}

              {/* Avatar Section */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '24px',
                  background: isAdmin ? 'linear-gradient(135deg, #6366f1, #a855f7)' : '#f1f5f9',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  marginBottom: '16px', fontSize: '32px', fontWeight: 'bold', 
                  color: isAdmin ? 'white' : '#64748b', transform: 'rotate(-3deg)'
                }}>
                  {u.name?.charAt(0).toUpperCase()}
                </div>

                <h3 style={{ color: '#1e293b', marginBottom: '4px', fontSize: '18px' }}>{u.name}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                  <Mail size={14} /> {u.email}
                </div>

                {/* Role Badge */}
                <div style={{
                  padding: '6px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '700',
                  background: isAdmin ? 'rgba(99, 102, 241, 0.1)' : '#f8fafc',
                  color: isAdmin ? '#6366f1' : '#64748b',
                  display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase'
                }}>
                  <Shield size={12} /> {u.role}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal design ko bhi cleaner banaya hai niche... */}
    </div>
  );
}