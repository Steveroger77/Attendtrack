import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import { ICONS } from '../constants';
import { mockApi } from '../services/api';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, onClick }) => (
    <Card 
        className="p-6 flex flex-col items-center justify-center text-center space-y-2"
        onClick={onClick}
    >
        <div className="text-purple-400">{icon}</div>
        <p className="text-4xl font-bold text-gray-100">{value}</p>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
    </Card>
);

const AdminDashboard: React.FC<{ setPage: (page: string) => void; }> = ({ setPage }) => {
  const [stats, setStats] = useState<{ totalUsers: number, totalStudents: number, totalLecturers: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await mockApi.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const renderValue = (value: number | undefined) => (loading ? '...' : value ?? 'N/A');

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-200 mb-2">Admin Dashboard</h1>
      <p className="text-lg text-gray-500 mb-6">System Management & Overview</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 flex items-center space-x-4">
          {ICONS.user}
          <div>
            <p className="text-sm text-gray-400">Total Users</p>
            <p className="text-2xl font-bold">{renderValue(stats?.totalUsers)}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center space-x-4">
          {ICONS.user}
          <div>
            <p className="text-sm text-gray-400">Total Students</p>
            <p className="text-2xl font-bold">{renderValue(stats?.totalStudents)}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center space-x-4">
          {ICONS.user}
          <div>
            <p className="text-sm text-gray-400">Total Lecturers</p>
            <p className="text-2xl font-bold">{renderValue(stats?.totalLecturers)}</p>
          </div>
        </Card>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={ICONS.user} label="Manage Users" value="Users" onClick={() => setPage('users')} />
            <StatCard icon={ICONS.admin} label="System Settings" value="Settings" onClick={() => setPage('settings')} />
            <StatCard icon={ICONS.clipboard} label="View Audit Log" value="Audit" onClick={() => setPage('audit')} />
        </div>
    </div>
  );
};

export default AdminDashboard;
