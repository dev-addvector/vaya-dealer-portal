import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getSettings, saveSMTP } from '@/api/admin.api';
import toast from 'react-hot-toast';

export default function SmtpSettingPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings });
  const settings = data?.data ?? {};

  const { register, handleSubmit } = useForm();

  const save = useMutation({
    mutationFn: saveSMTP,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('SMTP settings saved'); },
    onError: (err) => toast.error(err.message || 'Failed to save'),
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6 text-gray-800">SMTP Setting</h1>
      <div className="bg-white rounded-lg shadow p-5">
        <form
          onSubmit={handleSubmit((d) => save.mutate(d))}
          className="space-y-4"
        >
          <div>
            <label className="text-xs text-gray-600 block mb-1">SMTP Email</label>
            <input
              {...register('smtp_email', { required: true })}
              defaultValue={settings.smtp_email || ''}
              type="email"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">SMTP Password</label>
            <input
              {...register('smtp_pass')}
              defaultValue={settings.smtp_pass || ''}
              type="password"
              placeholder="Leave blank to keep current password"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary"
            />
          </div>
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-vaya-primary text-white px-5 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-60"
          >
            {save.isPending ? 'Saving...' : 'Save SMTP Setting'}
          </button>
        </form>
      </div>
    </div>
  );
}
