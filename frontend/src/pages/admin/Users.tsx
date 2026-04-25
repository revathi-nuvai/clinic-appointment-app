import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { User } from '../../types';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams({ limit: '20' });
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    api.get(`/users?${params}`)
      .then(res => setUsers(res.data.data || []))
      .catch(err => setFetchError(err.response?.data?.error || 'Failed to load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [role]); // eslint-disable-line

  const toggleActive = async (user: User) => {
    setToggling(user.id);
    setToggleError('');
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
      fetchUsers();
    } catch (err: any) {
      setToggleError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setToggling(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>

        {fetchError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{fetchError}</div>
        )}
        {toggleError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{toggleError}</div>
        )}

        <form onSubmit={e => { e.preventDefault(); fetchUsers(); }} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700">Search</button>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No users found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Role</th>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-5 py-3 text-gray-500">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        disabled={toggling === user.id}
                        onClick={() => toggleActive(user)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-60 ${
                          user.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {toggling === user.id ? '…' : user.is_active ? 'Deactivate' : 'Activate'}
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

export default AdminUsers;
