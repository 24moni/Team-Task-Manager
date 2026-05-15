import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Home, FolderKanban, ListTodo, Users, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Layout({ user, setUser }) {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const navItems = [
    { path: '/', name: 'Dashboard', icon: <Home size={18} /> },
    { path: '/projects', name: 'Projects', icon: <FolderKanban size={18} /> },
    { path: '/tasks', name: 'Task Board', icon: <ListTodo size={18} /> },
    { path: '/team', name: 'Team Members', icon: <Users size={18} /> },
  ];

  return (
    <>
      <nav className="nav-bar">
        <div className="logo">Team Task Manager</div>
        <div className="flex-between" style={{gap: '16px'}}>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="btn" 
            style={{background: 'transparent', color: 'var(--text-secondary)', padding: '8px'}}
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px'}}>
            <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <span style={{fontSize: '14px', fontWeight: '600'}}>{user?.name}</span>
              <span style={{fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize'}}>{user?.role}</span>
            </div>
          </div>
          
          <button className="btn btn-danger" onClick={handleLogout} style={{padding: '8px'}} title="Logout"><LogOut size={16} /></button>
        </div>
      </nav>

      <div className="dashboard-grid">
        {/* Sidebar Navigation */}
        <div className="glass-panel" style={{height: 'fit-content'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path}
                  to={item.path}
                  style={{
                    padding: '12px', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                    textDecoration: 'none',
                    background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'background 0.2s',
                    fontWeight: isActive ? '600' : '500'
                  }}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Page Content */}
        <div className="glass-panel" style={{minHeight: '70vh', position: 'relative'}}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
