import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Doctor } from '../../types';
import { SPECIALIZATIONS, DAYS_OF_WEEK } from '../../utils/constants';

const AdminDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    user_id: '',
    specialization: SPECIALIZATIONS[0],
    experience_years: 0,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as string[],
    available_from: '09:00',
    available_to: '17:00',
    slot_duration: 30,
    bio: '',
  });

  // Deactivate confirm modal
  const [deactivateTarget, setDeactivateTarget] = useState<Doctor | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  const fetchDoctors = () => {
    setLoading(true);
    setFetchError('');
    api.get('/doctors?limit=50')
      .then(res => setDoctors(res.data.data || []))
      .catch(err => setFetchError(err.response?.data?.error || 'Failed to load doctors.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctors(); }, []);

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      available_days: f.available_days.includes(day)
        ? f.available_days.filter(d => d !== day)
        : [...f.available_days, day],
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.available_days.length === 0) {
      setFormError('Select at least one available day.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await api.post('/doctors', form);
      setShowForm(false);
      setForm({
        user_id: '',
        specialization: SPECIALIZATIONS[0],
        experience_years: 0,
        available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        available_from: '09:00',
        available_to: '17:00',
        slot_duration: 30,
        bio: '',
      });
      fetchDoctors();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create doctor');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    setDeactivateError('');
    try {
      await api.delete(`/doctors/${deactivateTarget.id}`);
      setDeactivateTarget(null);
      fetchDoctors();
    } catch (err: any) {
      setDeactivateError(err.response?.data?.error || 'Failed to deactivate');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Doctors</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add Doctor'}
          </button>
        </div>

        {fetchError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{fetchError}</div>
        )}

        {/* Add doctor form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Add New Doctor</h2>
            {formError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{formError}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID (UUID of doctor's user account)</label>
              <input
                type="text"
                required
                value={form.user_id}
                onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                placeholder="e.g. 550e8400-e29b-41d4-a716-…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="time"
                  value={form.available_from}
                  onChange={e => setForm(f => ({ ...f, available_from: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="time"
                  value={form.available_to}
                  onChange={e => setForm(f => ({ ...f, available_to: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slot (min)</label>
                <select
                  value={form.slot_duration}
                  onChange={e => setForm(f => ({ ...f, slot_duration: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create Doctor Profile'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : doctors.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No doctors found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Specialization</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Experience</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {doctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">Dr. {doc.user?.name}</td>
                    <td className="px-5 py-3 text-blue-600">{doc.specialization}</td>
                    <td className="px-5 py-3 text-gray-500">{doc.experience_years} yrs</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${doc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {doc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {doc.is_active && (
                        <button
                          onClick={() => setDeactivateTarget(doc)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Deactivate confirm modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-2">Deactivate Doctor?</h3>
            <p className="text-sm text-gray-500 mb-1">
              Dr. <span className="font-medium">{deactivateTarget.user?.name}</span> will no longer appear in listings.
            </p>
            <p className="text-xs text-gray-400 mb-4">Active appointments must be resolved first.</p>
            {deactivateError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">{deactivateError}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setDeactivateTarget(null); setDeactivateError(''); }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivate}
                disabled={deactivating}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {deactivating ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDoctors;
