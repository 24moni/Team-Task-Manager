import { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import API_URL from '../config';

export default function Login({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Apply gradient background to body for auth page only
  useEffect(() => {
    document.body.classList.add('auth-body-gradient');
    return () => {
      document.body.classList.remove('auth-body-gradient');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin ? { email, password } : { name, email, password, role };
      
      const { data } = await axios.post(`${API_URL}${endpoint}`, payload);
      
      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success('Successfully logged in!');
      } else {
        setIsLogin(true);
        toast.success('Signup successful! Please login.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="auth-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-panel auth-card">
        <h2 className="logo" style={{textAlign: 'center', marginBottom: '8px'}}>Team Task Manager</h2>
        <p style={{textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px'}}>
          {isLogin ? 'Welcome back to your workspace' : 'Create your workspace account'}
        </p>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                className="input-with-icon"
                placeholder="Full Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input 
              type="email" 
              className="input-with-icon"
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input 
              type="password" 
              className="input-with-icon"
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="input-group">
              <ShieldCheck size={18} className="input-icon" />
              <select 
                className="input-with-icon" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          
          <button className="btn" style={{width: '100%', marginTop: '8px', padding: '12px'}} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        <div style={{textAlign: 'center', marginTop: '24px', fontSize: '14px'}}>
          <span style={{color: 'var(--text-secondary)'}}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <span 
            style={{color: 'var(--primary)', cursor: 'pointer', fontWeight: '500'}} 
            onClick={() => {setIsLogin(!isLogin); setError('');}}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
