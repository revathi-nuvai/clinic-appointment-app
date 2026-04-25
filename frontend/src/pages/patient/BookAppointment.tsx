import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Doctor } from '../../types';

const BookAppointment: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';

  useEffect(() => {
    if (!date || !time) {
      navigate(`/doctors/${doctorId}`);
      return;
    }
    api.get(`/doctors/${doctorId}`)
      .then(res => setDoctor(res.data.data))
      .catch(() => navigate('/doctors'));
  }, [doctorId, date, time, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/appointments', {
        doctor_id: doctorId,
        appointment_date: date,
        appointment_time: time,
        reason: reason.trim(),
      });
      navigate('/appointments', { state: { booked: true } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!doctor) {
    return <Layout><div className="text-center py-20 text-gray-400">Loading…</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Confirm Appointment</h1>

        {/* Summary card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
          <p className="text-sm text-gray-500 mb-1">Doctor</p>
          <p className="font-semibold text-gray-800">Dr. {doctor.user?.name}</p>
          <p className="text-sm text-blue-600">{doctor.specialization}</p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Date</p>
              <p className="font-medium text-gray-800">{date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Time</p>
              <p className="font-medium text-gray-800">{time}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for visit <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe your symptoms or reason for the appointment…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{reason.length}/500 characters (min 5)</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {submitting ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default BookAppointment;
