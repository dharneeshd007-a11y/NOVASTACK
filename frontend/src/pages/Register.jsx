import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Shield, Activity, MapPin, Navigation, Building2, CheckCircle2 } from 'lucide-react';

function Register() {
  const { register } = useContext(AuthContext);
  const { isConnected } = useContext(SocketContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'citizen' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Simple password strength calculation
  useEffect(() => {
    const p = formData.password;
    let strength = 0;
    if (p.length > 5) strength++;
    if (p.match(/[A-Z]/)) strength++;
    if (p.match(/[0-9]/)) strength++;
    if (p.match(/[^A-Za-z0-9]/)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.role) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-[#060a14] flex font-sans overflow-hidden">
      
      {/* Left Visual Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 border-r border-gray-800 bg-[#060a14] z-0">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        {/* Subtle ECG/Pulse background lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] text-red-500 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
           <polyline fill="none" stroke="currentColor" strokeWidth="0.5" points="0,50 30,50 35,30 45,70 50,50 100,50" />
           <polyline fill="none" stroke="currentColor" strokeWidth="0.2" points="0,70 20,70 25,40 35,90 40,70 100,70" />
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
            Emergency response, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">
              connected in seconds.
            </span>
          </h1>
          <p className="text-base text-gray-400 leading-relaxed max-w-sm">
            Connect citizens, ambulance teams and hospitals through one intelligent emergency response network.
          </p>

          {/* Abstract Nodes Animation - Minimalist */}
          <div className="mt-12 flex items-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-2 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-800">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse"></div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300">Citizen</span>
            </div>
            
            <div className="h-px w-8 bg-gray-700 relative overflow-hidden">
               <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-red-500 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>

            <div className="flex items-center space-x-2 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-800">
              <Navigation className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300">Ambulance</span>
            </div>

            <div className="h-px w-8 bg-gray-700 relative overflow-hidden">
               <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent -translate-x-full animate-[shimmer_2s_infinite_1s]"></div>
            </div>

            <div className="flex items-center space-x-2 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-800">
              <Building2 className="w-3 h-3 text-green-400" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300">Hospital</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center bg-gray-900/40 backdrop-blur px-4 py-2 rounded-full border border-gray-800/50 w-max">
           <div className={`w-2 h-2 rounded-full mr-3 ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
           <span className="text-xs font-medium text-gray-400">
             {isConnected ? 'EmergencyLink Network Online' : 'Connection unavailable. Retrying...'}
           </span>
        </div>
      </div>

      {/* Right Registration Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 animate-fade-in-up bg-[#0a0f1c]">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden flex items-center justify-center space-x-2 mb-8 w-full">
           <Activity className="w-6 h-6 text-red-500" />
           <span className="text-xl font-bold text-white tracking-widest">NOVASTACK</span>
        </div>

        <div className="w-full max-w-[420px] bg-[#0c1222] border border-gray-800/60 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
           
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create your EmergencyLink account</h2>
            <p className="text-gray-500 mt-1 text-sm">Join the emergency response network.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs px-3 py-2.5 rounded-lg flex items-center">
                <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              
              {/* Name */}
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input 
                  name="name" type="text" required placeholder="Full Name" 
                  value={formData.name} onChange={handleChange}
                  className="w-full h-[52px] bg-[#111827] border border-gray-700/80 text-white rounded-xl pl-11 pr-4 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-gray-600 text-sm"
                />
              </div>

              {/* Email */}
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input 
                  name="email" type="email" required placeholder="Email Address" 
                  value={formData.email} onChange={handleChange}
                  className="w-full h-[52px] bg-[#111827] border border-gray-700/80 text-white rounded-xl pl-11 pr-4 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-gray-600 text-sm"
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input 
                  name="password" type={showPassword ? "text" : "password"} required placeholder="Password" 
                  value={formData.password} onChange={handleChange}
                  className="w-full h-[52px] bg-[#111827] border border-gray-700/80 text-white rounded-xl pl-11 pr-11 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-gray-600 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 outline-none">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password.length > 0 && (
                 <div className="flex space-x-1 px-1 mt-1.5">
                   {[1,2,3,4].map(level => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${passwordStrength >= level ? (passwordStrength > 2 ? 'bg-green-500' : 'bg-yellow-500') : 'bg-gray-800'}`}></div>
                   ))}
                 </div>
              )}
            </div>

            {/* Role Selector */}
            <div className="pt-2">
              <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-2.5">Select Role</label>
              <div className="flex flex-col space-y-2">
                 {[
                   { id: 'citizen', name: 'Citizen', icon: <User className="w-4 h-4" />, desc: 'Report emergencies' },
                   { id: 'ambulance_driver', name: 'Ambulance Driver', icon: <Navigation className="w-4 h-4" />, desc: 'Respond & transport' },
                   { id: 'hospital', name: 'Hospital', icon: <Building2 className="w-4 h-4" />, desc: 'Receive patients' }
                 ].map(r => (
                    <label key={r.id} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${formData.role === r.id ? 'bg-red-500/10 border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-[#111827] border-gray-800 hover:border-gray-600'}`}>
                      <input type="radio" name="role" value={r.id} checked={formData.role === r.id} onChange={handleChange} className="hidden" />
                      <div className={`mr-3 ${formData.role === r.id ? 'text-red-500' : 'text-gray-500'}`}>
                        {r.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold text-sm ${formData.role === r.id ? 'text-red-50' : 'text-gray-300'}`}>{r.name}</div>
                        <div className="text-[11px] text-gray-500">{r.desc}</div>
                      </div>
                      {formData.role === r.id && <CheckCircle2 className="w-4 h-4 text-red-500" />}
                    </label>
                 ))}
              </div>
            </div>

            <button 
              type="submit" disabled={loading} 
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(220,38,38,0.3)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm"
            >
              {loading ? 'Creating Account...' : 'Create EmergencyLink Account'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-800/60 pt-5">
            <Link to="/login" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
              Already have an account? <span className="text-red-500 hover:text-red-400">Login</span>
            </Link>
          </div>
          
          <div className="mt-5 flex justify-center items-center text-[10px] text-gray-600">
             <Shield className="w-3 h-3 mr-1.5 opacity-50" />
             <span>Secure authentication protected</span>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}

export default Register;
