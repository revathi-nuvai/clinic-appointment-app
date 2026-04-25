import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Appointment } from '../../types';
import { STATUS_COLORS } from '../../utils/constants';
import { formatTime } from '../../utils/formatDate';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [todayApts, setTodayApts] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      api.get(`/appointments?date=${today}&limit=20`),
      api.get('/appointments?limit=100'),
    ]).then(([todayRes, allRes]) => {
      const todayData: Appointment[] = todayRes.data.data || [];
      const allData: Appointment[] = allRes.data.data || [];
      setTodayApts(todayData);
      setStats({
        total: allData.length,
        pending: allData.filter(a => a.status === 'pending').length,
        confirmed: allData.filter(a => a.status === 'confirmed').length,
        completed: allData.filter(a => a.status === 'completed').length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [today]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-blue-600 text-white rounded-xl p-6">
          <h1 className="text-2xl font-bold">Good day, Dr. {user?.name}!</h1>
          <p className="text-blue-100 mt-1">You have {todayApts.filter(a => a.status === 'confirmed' || a.status === 'pending').length} appointment(s) today.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-700' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Confirmed', value: stats.confirmed, color: 'text-blue-600' },
            { label: 'Completed', value: stats.completed, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-800">Today's Appointments</h2>
            <Link to="/doctor/appointments" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-400">Loading…</div>
          ) : todayApts.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No appointments today.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {todayApts.map(apt => (
                <li key={apt.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{(apt.patient as any)?.name}</p>
                    <p className="text-sm text-gray-500">{formatTime(apt.appointment_time)} &bull; {apt.reason}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[apt.status]}`}>
                    {apt.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DoctorDashboard;
