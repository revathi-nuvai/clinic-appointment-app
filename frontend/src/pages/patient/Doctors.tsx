import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Doctor } from '../../types';
import { SPECIALIZATIONS } from '../../utils/constants';

const DoctorCard: React.FC<{ doctor: Doctor }> = ({ doctor }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
        {(doctor.users?.name || 'D')[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800">Dr. {doctor.users?.name}</p>
        <p className="text-sm text-blue-600">{doctor.specialization}</p>
        <p className="text-xs text-gray-400">{doctor.experience_years} years experience</p>
      </div>
    </div>
    {doctor.bio && <p className="text-sm text-gray-500 line-clamp-2">{doctor.bio}</p>}
    <div className="text-xs text-gray-400">
      {doctor.available_days.slice(0, 3).join(', ')}{doctor.available_days.length > 3 ? '…' : ''} &bull; {doctor.available_from}–{doctor.available_to}
    </div>
    <Link
      to={`/doctors/${doctor.id}`}
      className="mt-1 text-center bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition"
    >
      View & Book
    </Link>
  </div>
);

const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDoctors = () => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams({ page: String(page), limit: '9' });
    if (search) params.set('search', search);
    if (specialization) params.set('specialization', specialization);
    api.get(`/doctors?${params}`)
      .then(res => {
        setDoctors(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      })
      .catch(err => setFetchError(err.response?.data?.error || 'Failed to load doctors.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctors(); }, [page, specialization]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Find a Doctor</h1>

        {/* Filters */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={specialization}
            onChange={e => { setSpecialization(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Specializations</option>
            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            Search
          </button>
        </form>

        {fetchError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{fetchError}</div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading doctors…</div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No doctors found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map(doc => <DoctorCard key={doc.id} doctor={doc} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Doctors;
