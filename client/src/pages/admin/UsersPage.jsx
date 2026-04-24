import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getUsers, disableUser, sendPasswordResetLink } from '@/api/admin.api';
import ChangeEmailModal from '@/components/admin/ChangeEmailModal';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page, perPage],
    queryFn: () => getUsers({ search, page, perPage }),
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  function getPageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (page >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', page - 1, page, page + 1, '…', totalPages];
  }

  const handleChangeEmail = (user) => {
    setSelectedUser(user);
    setShowEmailModal(true);
  };

  const handleSendPasswordReset = async (user) => {
    setLoadingActions(prev => ({ ...prev, [user.id]: 'reset' }));
    try {
      await sendPasswordResetLink({ userId: user.id });
      alert('Password reset link sent successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send password reset link');
    } finally {
      setLoadingActions(prev => ({ ...prev, [user.id]: null }));
    }
  };

  const handleToggleUserStatus = async (user) => {
    setLoadingActions(prev => ({ ...prev, [user.id]: 'toggle' }));
    try {
      await disableUser({ userId: user.id, isStatus: !user.isStatus });
      queryClient.invalidateQueries(['admin-users']);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setLoadingActions(prev => ({ ...prev, [user.id]: null }));
    }
  };

  const handleEmailChangeSuccess = () => {
    queryClient.invalidateQueries(['admin-users']);
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-gray-800">Users</h1>

      {/* Top bar: Show entries + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-vaya-green"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>entries</span>
        </div>
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-1 focus:ring-vaya-green"
        />
      </div>

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
      {!isLoading && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full text-sm border-collapse bg-white">
            <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
              <tr>
                {['Name', 'Email', 'UNC', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No users found</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-vaya-light/30">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.unc || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.isStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isStatus ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.unc && (
                        <button
                          title="View Orders"
                          onClick={() => navigate(`/admin/users/${encodeURIComponent(u.unc)}/orders`, { state: { userName: u.name } })}
                          className="text-vaya-primary hover:text-vaya-dark"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </button>
                      )}
                      
                      <button
                        title="Change Email"
                        onClick={() => handleChangeEmail(u)}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={loadingActions[u.id] === 'reset'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                      
                      <button
                        title="Send Password Reset"
                        onClick={() => handleSendPasswordReset(u)}
                        className="text-orange-600 hover:text-orange-800"
                        disabled={loadingActions[u.id] === 'reset'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                      
                      <button
                        title={u.isStatus ? "Disable User" : "Enable User"}
                        onClick={() => handleToggleUserStatus(u)}
                        className={`${u.isStatus ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                        disabled={loadingActions[u.id] === 'toggle'}
                      >
                        {u.isStatus ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom bar: showing info + page buttons */}
      {!isLoading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            {total === 0
              ? 'No entries found'
              : `Showing ${from} to ${to} of ${total} entries`}
          </p>

          <div className="flex items-center gap-1 justify-center">
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              «
            </button>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>

            {getPageNumbers().map((n, i) =>
              n === '…' ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`px-3 py-1.5 text-sm border rounded ${
                    n === page
                      ? 'bg-vaya-primary text-white border-vaya-primary'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              )
            )}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              »
            </button>
          </div>
        </div>
      )}
    <ChangeEmailModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={handleEmailChangeSuccess}
      />
    </div>
  );
}
