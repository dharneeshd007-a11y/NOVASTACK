import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenHome from './pages/CitizenHome';
import DriverHome from './pages/DriverHome';
import AdminHome from './pages/AdminHome';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return children;
};

const LandingPage = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
    <header className="bg-white shadow-sm py-6">
      <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
        <span className="text-2xl font-bold text-red-600">EmergencyLink</span>
        <nav className="space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Login</Link>
          <Link to="/register" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium cursor-pointer">Register</Link>
        </nav>
      </div>
    </header>
    <main className="flex-grow flex items-center justify-center">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Faster Coordination. Better Emergency Response.</h1>
        <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">NOVASTACK – EmergencyLink is a smart platform designed to streamline emergency response.</p>
        <Link to="/register" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg transform hover:scale-105 cursor-pointer inline-block">Get Started</Link>
      </div>
    </main>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/citizen" element={
        <ProtectedRoute allowedRoles={['citizen']}><CitizenHome /></ProtectedRoute>
      } />
      <Route path="/driver" element={
        <ProtectedRoute allowedRoles={['driver']}><DriverHome /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['hospital_admin']}><AdminHome /></ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
