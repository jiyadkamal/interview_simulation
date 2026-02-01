import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  LogIn,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/practice', icon: Mic, label: 'Practice Interview' },
  { path: '/performance', icon: BarChart3, label: 'Performance' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <Sparkles size={24} />
        </div>
        <span className="sidebar__logo-text">InterviewAI</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        <span className="sidebar__nav-label">NAVIGATION</span>
        <ul className="sidebar__nav-list">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        {isAuthenticated ? (
          <button className="sidebar__logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        ) : (
          <button className="sidebar__logout" onClick={handleLogin}>
            <LogIn size={20} />
            <span>Log In</span>
          </button>
        )}
      </div>
    </aside>
  );
}
