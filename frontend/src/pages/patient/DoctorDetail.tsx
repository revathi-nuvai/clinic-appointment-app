import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Doctor, TimeSlot } from '../../types';

const DoctorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then(res => setDoctor(res.data.data))
      .catch(err => setFetchError(err.response?.data?.error || 'Doctor not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchSlots = (date: string) => {
    setSelectedDate(date);
    setSlotsLoading(true);
    setSlotsError('');
    api.get(`/doctors/${id}/slots?date=${date}`)
      .then(res => setSlots(res.data.data?.slots || []))
      .catch(err => {
        setSlots([]);
        setSlotsError(err.response?.data?.error || 'Failed to load slots.');
      })
      .finally(() => setSlotsLoading(false));
  };

  // Min date = today
  const today = new Date().toISOString().split('T')[0];
  // Max date = 60 days from now
  const maxDate = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

  if (loading) {
    return <Layout><div className="text-center py-20 text-gray-400">Loading…</div></Layout>;
  }

  if (fetchError || !doctor) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-500 font-medium">{fetchError || 'Doctor not found.'}</p>
          <button
            onClick={() => navigate('/doctors')}
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            ← Back to Doctors
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Doctor info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl flex-shrink-0">
            {(doctor.user?.name || 'D')[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dr. {doctor.user?.name}</h1>
            <p className="text-blue-600 font-medium">{doctor.specialization}</p>
            <p className="text-sm text-gray-400">{doctor.experience_years} years experience</p>
            {doctor.bio && <p className="mt-3 text-sm text-gray-600">{doctor.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {doctor.available_days.map(day => (
                <span key={day} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{day}</span>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Hours: {doctor.available_from} – {doctor.available_to} &bull; {doctor.slot_duration} min slots
            </p>
          </div>
        </div>

        {/* Date picker */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Select a Date</h2>
          <input
            type="date"
            min={today}
            max={maxDate}
            value={selectedDate}
            onChange={e => fetchSlots(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Slots */}
        {selectedDate && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Available Slots</h2>
            {slotsLoading ? (
              <p className="text-gray-400 text-sm">Loading slots…</p>
            ) : slotsError ? (
              <p className="text-red-500 text-sm">{slotsError}</p>
            ) : slots.length === 0 ? (
              <p className="text-gray-400 text-sm">No slots available on this day.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {slots.map(slot => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => navigate(`/book/${id}?date=${selectedDate}&time=${slot.time}`)}
                    className={`py-2 text-sm rounded-lg font-medium transition ${
                      slot.available
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DoctorDetail;
