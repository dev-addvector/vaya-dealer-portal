import { useState } from 'react';

export default function ChangeEmailModal({ isOpen, onClose, user, onSuccess }) {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { changeUserEmail } = await import('@/api/admin.api');
      await changeUserEmail({ userId: user.id, newEmail });
      onSuccess();
      onClose();
      setNewEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Change Email</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            User: <span className="font-medium">{user.name}</span>
          </p>
          <p className="text-sm text-gray-600">
            Current Email: <span className="font-medium">{user.email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-vaya-green"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-vaya-primary text-white rounded hover:bg-vaya-dark disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
