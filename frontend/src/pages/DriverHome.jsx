import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function DriverHome() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Driver Dashboard (Placeholder)</h2>
        <p className="text-gray-600 mb-6">Welcome, {user?.name}!</p>
        <button onClick={handleLogout} className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 cursor-pointer">
          Logout
        </button>
      </div>
    </div>
  );
}
export default DriverHome;
