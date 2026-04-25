import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Doctor } from '../../types';
import { SPECIALIZATIONS, DAYS_OF_WEEK } from '../../utils/constants';

const DoctorProfile: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    specialization: '',
    experience_years: 0,
    available_days: [] as string[],
    available_from: '09:00',
    available_to: '17:00',
    slot_duration: 30,
    bio: '',
  });

  useEffect(() => {
    api.get('/doctors/me')
      .then(res => {
        const doc: Doctor = res.data.data;
        setDoctor(doc);
        setForm({
          specialization: doc.specialization,
          experience_years: doc.experience_years,
          available_days: doc.available_days,
          available_from: doc.available_from.slice(0, 5),
          available_to: doc.available_to.slice(0, 5),
          slot_duration: doc.slot_duration,
          bio: doc.bio || '',
        });
      })
      .catch(() => setError('Failed to load profile. Contact admin if your profile is missing.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      available_days: f.available_days.includes(day)
        ? f.available_days.filter(d => d !== day)
        : [...f.available_days, day],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!doctor) return;
    setSaving(true);
    try {
      await api.patch('/doctors/me', form);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="text-center py-20 text-gray-400">Loading…</div></Layout>;
  if (!doctor) return (
    <Layout>
      <div className="text-center py-20">
        <p className="text-gray-400">Doctor profile not found.</p>
        <p className="text-sm text-gray-400 mt-1">Contact an admin to create your profile.</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <select
              value={form.specialization}
              onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
            <input
              type="number"
              min={0}
              max={60}
              value={form.experience_years}
              onChange={e => setForm(f => ({ ...f, experience_years: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                    form.available_days.includes(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
              <input
                type="time"
                value={form.available_from}
                onChange={e => setForm(f => ({ ...f, available_from: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available To</label>
              <input
                type="time"
                value={form.available_to}
                onChange={e => setForm(f => ({ ...f, available_to: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration</label>
            <select
              value={form.slot_duration}
              onChange={e => setForm(f => ({ ...f, slot_duration: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Write a short bio about your expertise…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default DoctorProfile;
