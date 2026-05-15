import { useState, useEffect } from 'react';
import axios from 'axios';
import { User as UserIcon, Shield, Mail, Plus, X } from 'lucide-react';
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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/signup`, form);
      toast.success(`${form.name} added successfully!`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'member' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex-between" style={{marginBottom: '24px'}}>
        <h2>Team Members</h2>
        {currentUser.role === 'admin' && (
          <button className="btn" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Member
          </button>
        )}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px'}}>
        {users.map(u => (
          <div key={u._id} className="glass-panel" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: u.role === 'admin' ? 'linear-gradient(135deg, var(--warning), var(--primary))' : 'var(--primary)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              marginBottom: '16px', fontSize: '24px', fontWeight: 'bold', color: 'white'
            }}>
              {u.name.charAt(0).toUpperCase()}
            </div>
            <h3 style={{marginBottom: '4px'}}>
              {u.name} {currentUser._id === u._id && <span style={{fontSize: '12px', color: 'var(--success)'}}>(You)</span>}
            </h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px'}}>
              <Mail size={14} /> {u.email}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: u.role === 'admin' ? 'var(--warning)' : 'var(--text-primary)',
              fontSize: '13px', fontWeight: '600', marginTop: '8px',
              background: u.role === 'admin' ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.05)',
              padding: '4px 12px', borderRadius: '20px'
            }}>
              <Shield size={13} /> {u.role.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-panel"
            style={{width: '100%', maxWidth: '420px', position: 'relative'}}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)'}}
            ><X size={20} /></button>
            <h3 style={{marginBottom: '20px'}}>Add New Member</h3>
            <form onSubmit={handleAddMember}>
              <input
                type="text" placeholder="Full Name" required
                value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              />
              <input
                type="email" placeholder="Email Address" required
                value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              />
              <input
                type="password" placeholder="Password" required minLength={6}
                value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex-between" style={{marginTop: '20px'}}>
                <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
