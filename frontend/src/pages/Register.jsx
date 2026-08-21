import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Shield, Activity, Navigation, Building2, CheckCircle2, Phone, CreditCard, ArrowRight, ArrowLeft, MapPin } from 'lucide-react';

function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: '', phone: '', license: '', ambulance_number: '', address: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

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
      // The backend authController currently only explicitly uses name, email, password, role.
      await register(formData.name, formData.email, formData.password, formData.role);
      
      // If driver/hospital, show "waiting for admin approval" success state. 
      // For now, we'll navigate them directly as per existing auth flow.
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const roles = [
    { id: 'citizen', title: 'Citizen', desc: 'Request emergency assistance and track ambulances.', icon: <User className="w-6 h-6" /> },
    { id: 'ambulance_driver', title: 'Ambulance Driver', desc: 'Receive emergency requests and transport patients.', icon: <Navigation className="w-6 h-6" /> },
    { id: 'hospital', title: 'Hospital', desc: 'Manage incoming emergency patients.', icon: <Building2 className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-brand-navy)] flex font-sans overflow-hidden">
      
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 border-r border-white/5 bg-[var(--color-brand-navy)] z-0">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-16">
            <Activity className="w-8 h-8 text-red-500 animate-pulse" />
            <div>
              <span className="text-xl font-bold text-white tracking-widest">NOVASTACK</span>
              <span className="text-xl text-gray-400 font-light ml-2">EmergencyLink</span>
            </div>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
            Join the emergency <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">
              response network.
            </span>
          </h1>
          <p className="text-base text-gray-400 leading-relaxed max-w-sm">
            Whether you need help or provide help, your presence saves lives.
          </p>
        </div>
        <div className="relative z-10 text-xs font-medium text-gray-500">
          © {new Date().getFullYear()} NOVASTACK OpenHack. All rights reserved.
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 animate-fade-in-up bg-[var(--color-brand-navy-light)]">
        
        <div className="lg:hidden flex items-center justify-center space-x-2 mb-8 w-full">
           <Activity className="w-6 h-6 text-red-500" />
           <span className="text-xl font-bold text-white tracking-widest">NOVASTACK</span>
        </div>

        <div className="w-full max-w-[480px]">
           
          {step === 1 && (
            <div className="animate-fade-in-up">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Choose account type</h2>
                <p className="text-gray-400 mt-2 text-sm">Select how you will use EmergencyLink.</p>
              </div>

              <div className="space-y-4">
                {roles.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => setFormData({ ...formData, role: r.id })}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.role === r.id 
                        ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)] transform -translate-y-1' 
                        : 'border-white/10 bg-white/5 hover:border-gray-500 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`p-3 rounded-xl mr-4 ${formData.role === r.id ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-gray-800 text-gray-400'}`}>
                        {r.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-1 ${formData.role === r.id ? 'text-white' : 'text-gray-300'}`}>{r.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{r.desc}</p>
                      </div>
                      <div className="flex items-center h-full pt-1">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.role === r.id ? 'border-red-500 bg-red-500' : 'border-gray-600'}`}>
                          {formData.role === r.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => formData.role && setStep(2)}
                disabled={!formData.role}
                className="w-full h-14 bg-white text-black hover:bg-gray-200 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-8 flex items-center justify-center text-sm"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-up">
              <button onClick={() => setStep(1)} className="flex items-center text-gray-400 hover:text-white text-sm mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to roles
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {formData.role === 'citizen' ? 'Create Citizen Account' : 
                   formData.role === 'ambulance_driver' ? 'Driver Registration' : 'Hospital Registration'}
                </h2>
                <p className="text-gray-400 mt-2 text-sm">
                  {formData.role === 'citizen' ? 'Enter your details below to get started.' : 
                   'Your account will be reviewed by Admin before activation.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center shadow-lg">
                    <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                    <input 
                      name="name" type="text" required placeholder={formData.role === 'hospital' ? "Hospital Name" : "Full Name"} 
                      value={formData.name} onChange={handleChange}
                      className="w-full h-[52px] bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all placeholder-gray-500 text-sm"
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                    <input 
                      name="email" type="email" required placeholder="Email Address" 
                      value={formData.email} onChange={handleChange}
                      className="w-full h-[52px] bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all placeholder-gray-500 text-sm"
                    />
                  </div>
                  
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                    <input 
                      name="phone" type="text" placeholder="Phone Number" 
                      value={formData.phone} onChange={handleChange}
                      className="w-full h-[52px] bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all placeholder-gray-500 text-sm"
                    />
                  </div>

                  {formData.role === 'ambulance_driver' && (
                    <>
                      <div className="relative group">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                        <input 
                          name="license" type="text" required placeholder="Driving License Number" 
                          value={formData.license} onChange={handleChange}
                          className="w-full h-[52px] bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all placeholder-gray-500 text-sm"
                        />
                      </div>
                      <div className="relative group">
                        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                        <input 
                          name="ambulance_number" type="text" required placeholder="Ambulance Number (e.g. TN 00 XX 0000)" 
                          value={formData.ambulance_number} onChange={handleChange}
                          className="w-full h-[52px] bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all placeholder-gray-500 text-sm"
                        />
                      </div>
                    </>
                  )}

                  {formData.role === 'hospital' && (
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                      <input 
                        name="address" type="text" required placeholder="Hospital Address" 
                        value={formData.address} onChange={handleChange}
                        className="w-full h-[52px] bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all placeholder-gray-500 text-sm"
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                    <input 
                      name="password" type={showPassword ? "text" : "password"} required placeholder="Password" 
                      value={formData.password} onChange={handleChange}
                      className="w-full h-[52px] bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-12 focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all placeholder-gray-500 text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white outline-none">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {formData.password.length > 0 && (
                     <div className="flex space-x-1 px-1 pt-1">
                       {[1,2,3,4].map(level => (
                          <div key={level} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${passwordStrength >= level ? (passwordStrength > 2 ? 'bg-green-500' : 'bg-yellow-500') : 'bg-gray-800'}`}></div>
                       ))}
                     </div>
                  )}
                </div>

                <button 
                  type="submit" disabled={loading} 
                  className="w-full h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(220,38,38,0.3)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center text-sm"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </div>
                  ) : 'Complete Registration'}
                </button>
              </form>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Already have an account? <span className="text-red-500 hover:text-red-400 ml-1">Login</span>
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Register;
