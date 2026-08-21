import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState({ total: 0, active: 0, resolved: 0, critical: 0 });
  const [trends, setTrends] = useState([]);
  const [types, setTypes] = useState([]);
  const socket = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [o, tr, ty] = await Promise.all([
        axios.get((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/analytics/overview', { headers }),
        axios.get((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/analytics/trends', { headers }),
        axios.get((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/analytics/types', { headers }),
      ]);
      setOverview(o.data);
      setTrends(tr.data);
      setTypes(ty.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  useEffect(() => {
    if (user?.role !== 'hospital_admin') {
      navigate('/dashboard');
      return;
    }
    fetchAnalytics();
  }, [user, navigate]);

  useEffect(() => {
    if (!socket) return;
    socket.on('analytics_updated', fetchAnalytics);
    return () => socket.off('analytics_updated');
  }, [socket]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Analytics & Operations</h1>
            <p className="text-gray-600">Real-time intelligence and historical data.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="border px-4 py-2 rounded bg-white hover:bg-gray-50 cursor-pointer">
            &larr; Back to Dashboard
          </button>
        </div>

        {/* AI Insights Section */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-lg p-6 mb-8 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-2 flex items-center">
            <span className="text-yellow-400 mr-2">✨</span> Smart Operations Insights
          </h2>
          <ul className="list-disc list-inside space-y-1 text-blue-100">
            {overview.critical > 0 && <li><strong>Attention:</strong> There are currently {overview.critical} critical emergencies that require monitoring.</li>}
            {types.length > 0 && <li><strong>Trend:</strong> {types.sort((a,b)=>b.value-a.value)[0]?.name} is the most frequent emergency type reported.</li>}
            <li><strong>Status:</strong> {overview.active} active incidents are currently being managed by responders.</li>
          </ul>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Incidents</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{overview.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Active Responses</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{overview.active}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-red-500 text-sm font-medium uppercase tracking-wider">Critical Priority</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{overview.critical}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Resolved</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{overview.resolved}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Emergency Volume (Last 30 Days)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="emergencies" stroke="#ef4444" strokeWidth={3} dot={{r: 4, fill: '#ef4444', strokeWidth: 0}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Type Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Distribution by Type</h2>
            <div className="h-72">
              {types.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={types}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {types.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
