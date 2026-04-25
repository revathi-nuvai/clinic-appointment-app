import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Appointment } from '../../types';
import { STATUS_COLORS } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/formatDate';

const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    const params = filterStatus ? `?status=${filterStatus}` : '';
    api.get(`/appointments${params}`)
      .then(res => setAppointments(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [filterStatus]); // eslint-disable-line

  const updateStatus = async (id: string, status: string, notes?: string) => {
    setUpdating(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status, notes });
      fetch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition ${
                  filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No appointments found.</div>
        ) : (
          <div className="space-y-3">
            {appointments.map(apt => (
              <div key={apt.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{(apt.patient as any)?.name}</p>
                    <p className="text-sm text-gray-400">{(apt.patient as any)?.email}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{apt.reason}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${STATUS_COLORS[apt.status]}`}>
                    {apt.status}
                  </span>
                </div>

                {/* Actions */}
                {apt.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      disabled={updating === apt.id}
                      onClick={() => updateStatus(apt.id, 'confirmed')}
                      className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
                    >
                      Confirm
                    </button>
                    <button
                      disabled={updating === apt.id}
                      onClick={() => updateStatus(apt.id, 'cancelled', 'Cancelled by doctor')}
                      className="flex-1 border border-red-300 text-red-600 text-sm py-2 rounded-lg hover:bg-red-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {apt.status === 'confirmed' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      disabled={updating === apt.id}
                      onClick={() => updateStatus(apt.id, 'completed')}
                      className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    >
                      Mark Complete
                    </button>
                    <button
                      disabled={updating === apt.id}
                      onClick={() => updateStatus(apt.id, 'cancelled', 'Cancelled by doctor')}
                      className="flex-1 border border-red-300 text-red-600 text-sm py-2 rounded-lg hover:bg-red-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DoctorAppointments;
