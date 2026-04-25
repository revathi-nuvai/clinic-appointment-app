import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Doctor } from '../../types';
import { SPECIALIZATIONS } from '../../utils/constants';

const AdminDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    user_id: '',
    specialization: SPECIALIZATIONS[0],
    experience_years: 0,
    available_from: '09:00',
    available_to: '17:00',
    slot_duration: 30,
    bio: '',
  });

  const fetchDoctors = () => {
    setLoading(true);
    api.get('/doctors?limit=50&is_active=true')
      .then(res => setDoctors(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/doctors', {
        ...form,
        available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      });
      setShowForm(false);
      setForm({ user_id: '', specialization: SPECIALIZATIONS[0], experience_years: 0, available_from: '09:00', available_to: '17:00', slot_duration: 30, bio: '' });
      fetchDoctors();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create doctor');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id: string) => {
    if (!window.confirm('Deactivate this doctor?')) return;
    try {
      await api.delete(`/doctors/${id}`);
      fetchDoctors();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to deactivate');
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
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {doctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">Dr. {doc.user?.name}</td>
                    <td className="px-5 py-3 text-blue-600">{doc.specialization}</td>
                    <td className="px-5 py-3 text-gray-500">{doc.experience_years} yrs</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => deactivate(doc.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDoctors;
