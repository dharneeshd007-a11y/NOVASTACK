import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Shield, Activity, MapPin, Navigation, Building2, CheckCircle2 } from 'lucide-react';

function Register() {
  const { register } = useContext(AuthContext);
  const { isConnected } = useContext(SocketContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'citizen' });
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

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
    <div className="min-h-screen bg-[#0a0f1c] flex font-sans overflow-hidden">
      
      {/* Left Visual Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-[#060a14] flex-col justify-between p-12 border-r border-gray-800 shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Red Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>

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
          <p className="text-lg text-gray-400 leading-relaxed max-w-md">
            Connect citizens, ambulance teams and hospitals through one intelligent emergency response network.
          </p>

          {/* Abstract Nodes Animation */}
          <div className="mt-16 flex items-center space-x-6 text-gray-500">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center shadow-lg border border-gray-700 relative">
                <MapPin className="w-5 h-5 text-gray-300" />
                <div className="absolute w-full h-full rounded-full border border-red-500/30 animate-ping"></div>
              </div>
              <span className="text-xs mt-3 uppercase tracking-wider font-bold">Citizen</span>
            </div>
            
            <div className="h-0.5 w-16 bg-gradient-to-r from-gray-700 to-gray-700 relative overflow-hidden">
               <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-red-500 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center shadow-lg border border-gray-700">
                <Navigation className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs mt-3 uppercase tracking-wider font-bold">Ambulance</span>
            </div>

            <div className="h-0.5 w-16 bg-gradient-to-r from-gray-700 to-gray-700 relative overflow-hidden">
               <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent -translate-x-full animate-[shimmer_2s_infinite_1s]"></div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center shadow-lg border border-gray-700">
                <Building2 className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs mt-3 uppercase tracking-wider font-bold">Hospital</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center bg-gray-900/50 backdrop-blur px-4 py-2 rounded-full border border-gray-800 w-max">
           <div className={`w-2.5 h-2.5 rounded-full mr-3 ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
           <span className="text-sm font-medium text-gray-300">
             {isConnected ? 'EmergencyLink Network Online' : 'Connection unavailable. Retrying...'}
           </span>
        </div>
      </div>

      {/* Right Registration Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 animate-fade-in-up">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
           <Activity className="w-6 h-6 text-red-500" />
           <span className="text-xl font-bold text-white tracking-widest">NOVASTACK</span>
        </div>

        <div className="w-full max-w-[480px] bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
           
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-white tracking-tight">Create your EmergencyLink account</h2>
            <p className="text-gray-400 mt-2 text-sm">Join the emergency response network.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-lg flex items-center">
                <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              
              {/* Name */}
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input 
                  name="name" type="text" required placeholder="Full Name" 
                  value={formData.name} onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-gray-600"
                />
              </div>

              {/* Email */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input 
                  name="email" type="email" required placeholder="Email Address" 
                  value={formData.email} onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-gray-600"
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input 
                  name="password" type={showPassword ? "text" : "password"} required placeholder="Password" 
                  value={formData.password} onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-gray-600"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength */}
              {formData.password.length > 0 && (
                 <div className="flex space-x-1 px-1">
                   {[1,2,3,4].map(level => (
                      <div key={level} className={`h-1 flex-1 rounded-full ${passwordStrength >= level ? (passwordStrength > 2 ? 'bg-green-500' : 'bg-yellow-500') : 'bg-gray-700'}`}></div>
                   ))}
                 </div>
              )}

              {/* Confirm Password */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <input 
                  name="confirmPassword" type={showPassword ? "text" : "password"} required placeholder="Confirm Password" 
                  value={formData.confirmPassword} onChange={handleChange}
                  className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-gray-600"
                />
              </div>

            </div>

            {/* Role Selector */}
            <div className="pt-2">
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">Select Role</label>
              <div className="grid grid-cols-1 gap-3">
                 {[
                   { id: 'citizen', name: 'Citizen', icon: <User className="w-5 h-5" />, desc: 'Report emergencies' },
                   { id: 'ambulance_driver', name: 'Ambulance Driver', icon: <Navigation className="w-5 h-5" />, desc: 'Respond & transport' },
                   { id: 'hospital', name: 'Hospital', icon: <Building2 className="w-5 h-5" />, desc: 'Receive patients' }
                 ].map(r => (
                    <label key={r.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.role === r.id ? 'bg-red-500/10 border-red-500' : 'bg-gray-900/50 border-gray-700 hover:border-gray-500'}`}>
                      <input type="radio" name="role" value={r.id} checked={formData.role === r.id} onChange={handleChange} className="hidden" />
                      <div className={`mr-4 ${formData.role === r.id ? 'text-red-500' : 'text-gray-400'}`}>
                        {r.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold text-sm ${formData.role === r.id ? 'text-white' : 'text-gray-300'}`}>{r.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                      </div>
                      {formData.role === r.id && <CheckCircle2 className="w-5 h-5 text-red-500" />}
                    </label>
                 ))}
              </div>
            </div>

            <button 
              type="submit" disabled={loading} 
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-800 pt-6">
            <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Already have an account? <span className="text-red-500">Login</span>
            </Link>
          </div>

          <div className="mt-8 flex justify-center items-center text-xs text-gray-600">
             <Shield className="w-4 h-4 mr-2 opacity-50" />
             <span>Your information is protected with secure authentication.</span>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}

export default Register;
