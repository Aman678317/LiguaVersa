import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeUsers: 0,
    activeMeetings: 0,
    totalTranslations: 0,
    systemHealth: { cpuUsage: 0, memoryUsage: 0, activeSockets: 0 }
  });
  const [errorLogs, setErrorLogs] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/admin/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      }
    };
    
    const fetchErrors = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/admin/errors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setErrorLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch errors", err);
      }
    };

    fetchStats();
    fetchErrors();

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      query: { userId: user.id }
    });

    socket.on('server:health', (health) => {
      setStats(prev => ({
        ...prev,
        systemHealth: health
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [user, navigate]);

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Enterprise Admin Dashboard</h1>
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Active Users</h3>
            <p className="text-4xl font-bold text-blue-400 mt-2">{stats.activeUsers}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Ongoing Meetings</h3>
            <p className="text-4xl font-bold text-green-400 mt-2">{stats.activeMeetings}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Total Translations</h3>
            <p className="text-4xl font-bold text-purple-400 mt-2">{stats.totalTranslations}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Active Sockets</h3>
            <p className="text-4xl font-bold text-yellow-400 mt-2">{stats.systemHealth.activeSockets}</p>
          </div>
        </div>

        {/* Live System Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">System Telemetry (Live)</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage (Load Avg)</span>
                  <span className="font-mono">{stats.systemHealth.cpuUsage.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.systemHealth.cpuUsage * 10)}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span className="font-mono">{stats.systemHealth.memoryUsage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.systemHealth.memoryUsage}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Recent Error Logs</h3>
            <div className="overflow-y-auto max-h-48 pr-2">
              {errorLogs.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No recent errors detected.</p>
              ) : (
                <ul className="space-y-3">
                  {errorLogs.map(log => (
                    <li key={log.id} className="text-sm bg-gray-900 p-3 rounded border-l-4 border-red-500">
                      <div className="flex justify-between text-gray-400 mb-1 text-xs">
                        <span className="uppercase tracking-widest">{log.service}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-200">{log.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
