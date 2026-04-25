import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Appointment } from '../../types';
import { STATUS_COLORS } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/formatDate';

const AdminAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (filterStatus) params.set('status', filterStatus);
    api.get(`/appointments?${params}`)
      .then(res => {
        setAppointments(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      })
      .catch(err => setFetchError(err.response?.data?.error || 'Failed to load appointments.'))
      .finally(() => setLoading(false));
  }, [page, filterStatus]);

  const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-800">All Appointments</h1>
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setPage(1); }}
                className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition ${
                  filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {fetchError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{fetchError}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No appointments found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Patient</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Doctor</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Date & Time</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{(apt.patient as any)?.name}</p>
                      <p className="text-xs text-gray-400">{(apt.patient as any)?.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-800">Dr. {(apt.doctor as any)?.user?.name}</p>
                      <p className="text-xs text-blue-500">{(apt.doctor as any)?.specialization}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatDate(apt.appointment_date)}<br />
                      <span className="text-xs">{formatTime(apt.appointment_time)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[apt.status]}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminAppointments;
