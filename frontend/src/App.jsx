import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmergencyDetails from './pages/EmergencyDetails';
import ResponseHistory from './pages/ResponseHistory';
import LiveLocationTracker from './components/LiveLocationTracker';
import ConnectionStatus from './components/ConnectionStatus';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import CommandCenter from './pages/CommandCenter';
import AuditLogs from './pages/AuditLogs';
import Broadcasts from './pages/Broadcasts';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
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
    <>
      <ConnectionStatus />
      <LiveLocationTracker />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/admin/command-center" element={
          <ProtectedRoute><CommandCenter /></ProtectedRoute>
        } />
        <Route path="/admin/agencies" element={
          <ProtectedRoute><AdminAgencies /></ProtectedRoute>
        } />
        <Route path="/hospital/dashboard" element={
          <ProtectedRoute><HospitalDashboard /></ProtectedRoute>
        } />
        <Route path="/ambulance/dashboard" element={
          <ProtectedRoute><AmbulanceDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/audit-logs" element={
          <ProtectedRoute><AuditLogs /></ProtectedRoute>
        } />
        <Route path="/admin/broadcast" element={
          <ProtectedRoute><Broadcasts /></ProtectedRoute>
        } />
        <Route path="/emergencies/:id" element={
          <ProtectedRoute><EmergencyDetails /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><ResponseHistory /></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
