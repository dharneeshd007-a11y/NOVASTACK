import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, Activity, MapPin, Navigation } from 'lucide-react';

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      if (user.role === 'system_admin') navigate('/admin/command-center');
      else if (user.role === 'ambulance_driver') navigate('/ambulance/dashboard');
      else if (user.role === 'hospital' || user.role === 'hospital_admin') navigate('/hospital/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-[var(--color-brand-navy)] flex font-sans overflow-hidden">
      
      {/* Left Visual Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-[50%] relative flex-col justify-between p-12 border-r border-white/5 bg-[var(--color-brand-navy)] z-0">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] text-red-500 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
           <polyline fill="none" stroke="currentColor" strokeWidth="0.5" points="0,50 30,50 35,30 45,70 50,50 100,50" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-16">
            <Activity className="w-8 h-8 text-red-500 animate-pulse" />
            <div>
              <span className="text-xl font-bold text-white tracking-widest">NOVASTACK</span>
              <span className="text-xl text-gray-400 font-light ml-2">EmergencyLink</span>
            </div>
          </div>

          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
            Connecting people <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">
              to emergency care, faster.
            </span>
          </h1>

          <div className="space-y-8 mt-16 max-w-sm">
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mr-4 shrink-0 mt-1">
                <MapPin className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Fast Response</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Connect citizens with nearby ambulances instantly using precise GPS location.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mr-4 shrink-0 mt-1">
                <Navigation className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Smart Dispatch</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Automatically find the nearest available driver without manual intervention.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs font-medium text-gray-500">
          © {new Date().getFullYear()} NOVASTACK OpenHack. All rights reserved.
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 animate-[fade-in-up_0.5s_ease-out] bg-[var(--color-brand-navy-light)]">
        
        <div className="lg:hidden flex items-center justify-center space-x-2 mb-10 w-full">
           <Activity className="w-6 h-6 text-red-500" />
           <span className="text-xl font-bold text-white tracking-widest">NOVASTACK</span>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-gray-400 mt-2 text-sm">Sign in to EmergencyLink.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center shadow-lg">
                <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input 
                  name="email" type="email" required placeholder="Email Address" 
                  value={formData.email} onChange={handleChange}
                  className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all placeholder-gray-500 text-sm"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input 
                  name="password" type={showPassword ? "text" : "password"} required placeholder="Password" 
                  value={formData.password} onChange={handleChange}
                  className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-12 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all placeholder-gray-500 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors outline-none">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer text-gray-400 hover:text-gray-300">
                <input type="checkbox" className="mr-2 accent-red-500 w-4 h-4 rounded border-gray-700 bg-gray-800" />
                Remember me
              </label>
              <a href="#" className="text-red-500 hover:text-red-400 font-medium transition-colors">Forgot password?</a>
            </div>

            <button 
              type="submit" disabled={loading} 
              className="w-full h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(220,38,38,0.3)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                  Authenticating...
                </div>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/register" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Don't have an account? <span className="text-red-500 hover:text-red-400 ml-1">Create account</span>
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Login;
