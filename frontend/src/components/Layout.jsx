import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Navigation, Building2, ShieldAlert, LogOut, Search, Bell, User } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSidebarLinks = () => {
    if (!user) return [];
    
    if (user.role === 'system_admin') {
      return [
        { path: '/admin/command-center', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview' },
        { path: '/admin/agencies', icon: <Building2 className="w-5 h-5" />, label: 'Agencies & Hospitals' },
        { path: '/analytics', icon: <Activity className="w-5 h-5" />, label: 'Analytics' },
        { path: '/admin/audit-logs', icon: <ShieldAlert className="w-5 h-5" />, label: 'Audit Logs' },
      ];
    }
    if (user.role === 'ambulance_driver') {
      return [
        { path: '/ambulance/dashboard', icon: <Navigation className="w-5 h-5" />, label: 'Dispatch Center' },
      ];
    }
    if (user.role === 'hospital' || user.role === 'hospital_admin') {
      return [
        { path: '/hospital/dashboard', icon: <Building2 className="w-5 h-5" />, label: 'Emergency Room' },
      ];
    }
    // citizen
    return [
      { path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    ];
  };

  const links = getSidebarLinks();

  return (
    <div className="min-h-screen bg-[var(--color-brand-navy)] flex font-sans overflow-hidden text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-brand-navy-light)] border-r border-white/5 flex flex-col z-20 shadow-2xl relative">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Activity className="w-6 h-6 text-red-500 mr-2" />
          <span className="text-lg font-bold tracking-widest text-white">NOVASTACK</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 px-3 mb-2">Main Menu</div>
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-red-500/10 text-red-500 font-medium' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`mr-3 ${isActive ? 'text-red-500' : 'opacity-70'}`}>
                  {link.icon}
                </div>
                <span className="text-sm">{link.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-red-400 transition-all text-sm"
          >
            <LogOut className="w-5 h-5 mr-3 opacity-70" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Topbar */}
        <header className="h-16 bg-[var(--color-brand-navy-light)]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center text-sm text-gray-400">
            {/* Simple breadcrumb or greeting could go here */}
            {user ? <span className="capitalize">{user.role.replace('_', ' ')} Portal</span> : ''}
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[var(--color-brand-navy-light)]"></span>
            </button>
            <div className="h-6 w-px bg-white/10 mx-2"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border border-white/10">
                <User className="w-4 h-4 text-gray-300" />
              </div>
              <span className="ml-3 text-sm font-medium hidden sm:block">{user?.name || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-transparent relative z-0 hide-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
