import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Appointment } from '../../types';
import { STATUS_COLORS } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/formatDate';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/appointments?limit=5&sort=appointment_date&order=desc')
      .then(res => setAppointments(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const past = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-blue-600 text-white rounded-xl p-6">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="mt-1 text-blue-100">Manage your health appointments easily.</p>
          <Link
            to="/doctors"
            className="mt-4 inline-block bg-white text-blue-600 font-semibold px-5 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            Book Appointment
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: appointments.length, color: 'text-gray-700' },
            { label: 'Upcoming', value: upcoming.length, color: 'text-blue-600' },
            { label: 'Completed', value: past.filter(a => a.status === 'completed').length, color: 'text-green-600' },
            { label: 'Cancelled', value: past.filter(a => a.status === 'cancelled').length, color: 'text-red-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-800">Recent Appointments</h2>
            <Link to="/appointments" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-400">Loading…</div>
          ) : appointments.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No appointments yet.{' '}
              <Link to="/doctors" className="text-blue-600 hover:underline">Book one now</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {appointments.slice(0, 5).map(apt => (
                <li key={apt.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      Dr. {(apt.doctor as any)?.user?.name || '—'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{apt.reason}</p>
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

export default PatientDashboard;
