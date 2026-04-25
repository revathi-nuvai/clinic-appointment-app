import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';

const StatCard: React.FC<{ label: string; value: number; color: string; to: string }> = ({ label, value, color, to }) => (
  <Link to={to} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition block">
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-4xl font-bold mt-1 ${color}`}>{value}</p>
  </Link>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ users: 0, doctors: 0, appointments: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users?limit=1'),
      api.get('/doctors?limit=1'),
      api.get('/appointments?limit=1'),
      api.get('/appointments?status=pending&limit=1'),
    ]).then(([u, d, a, p]) => {
      setStats({
        users: u.data.pagination?.total || 0,
        doctors: d.data.pagination?.total || 0,
        appointments: a.data.pagination?.total || 0,
        pending: p.data.pagination?.total || 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.users} color="text-gray-800" to="/admin/users" />
            <StatCard label="Doctors" value={stats.doctors} color="text-blue-600" to="/admin/doctors" />
            <StatCard label="Appointments" value={stats.appointments} color="text-green-600" to="/admin/appointments" />
            <StatCard label="Pending" value={stats.pending} color="text-yellow-600" to="/admin/appointments" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Manage Doctors', desc: 'Add, update, or deactivate doctors', to: '/admin/doctors', color: 'bg-blue-600' },
            { title: 'Manage Users', desc: 'View and activate/deactivate user accounts', to: '/admin/users', color: 'bg-purple-600' },
            { title: 'All Appointments', desc: 'View all clinic appointments', to: '/admin/appointments', color: 'bg-green-600' },
          ].map(card => (
            <Link key={card.to} to={card.to} className={`${card.color} text-white rounded-xl p-5 hover:opacity-90 transition`}>
              <h3 className="font-semibold text-lg">{card.title}</h3>
              <p className="text-sm opacity-80 mt-1">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
