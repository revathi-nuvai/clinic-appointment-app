import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Appointment } from '../../types';
import { STATUS_COLORS } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/formatDate';

const MyAppointments: React.FC = () => {
  const location = useLocation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [successMsg, setSuccessMsg] = useState(
    (location.state as any)?.booked ? 'Appointment booked successfully!' : ''
  );
  const [fetchError, setFetchError] = useState('');

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 5000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const fetchAppointments = () => {
    setLoading(true);
    setFetchError('');
    const params = filterStatus ? `?status=${filterStatus}` : '';
    api.get(`/appointments${params}`)
      .then(res => setAppointments(res.data.data || []))
      .catch(err => setFetchError(err.response?.data?.error || 'Failed to load appointments.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, [filterStatus]); // eslint-disable-line

  const handleCancel = async () => {
    if (!cancelId || cancelReason.trim().length < 3) return;
    setCancelling(true);
    try {
      await api.patch(`/appointments/${cancelId}/status`, {
        status: 'cancelled',
        cancel_reason: cancelReason.trim(),
      });
      setCancelId(null);
      setCancelReason('');
      setSuccessMsg('Appointment cancelled.');
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {successMsg}
          </div>
        )}

        {fetchError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{fetchError}</div>
        )}

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
                    <p className="font-semibold text-gray-800">
                      Dr. {(apt.doctor as any)?.user?.name || '—'}
                    </p>
                    <p className="text-sm text-blue-600">{(apt.doctor as any)?.specialization}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{apt.reason}</p>
                    {apt.notes && (
                      <p className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded mt-2">
                        Note: {apt.notes}
                      </p>
                    )}
                    {apt.cancel_reason && (
                      <p className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded mt-2">
                        Cancelled: {apt.cancel_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[apt.status]}`}>
                      {apt.status}
                    </span>
                    {(apt.status === 'pending' || apt.status === 'confirmed') && (
                      <button
                        onClick={() => setCancelId(apt.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Cancel Appointment</h3>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (min 3 characters)…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{cancelReason.trim().length} chars</p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => { setCancelId(null); setCancelReason(''); }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling || cancelReason.trim().length < 3}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyAppointments;
