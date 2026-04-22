import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getSettings, saveSetting, uploadLoginImage } from '@/api/admin.api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings });
  const settings = data?.data ?? {};

  const { register, handleSubmit } = useForm();

  const save = useMutation({
    mutationFn: saveSetting,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('Setting saved'); },
    onError: (err) => toast.error(err.message || 'Failed'),
  });

  const uploadImg = useMutation({
    mutationFn: (file) => { const f = new FormData(); f.append('image', file); return uploadLoginImage(f); },
    onSuccess: () => toast.success('Login image updated'),
    onError: () => toast.error('Failed to upload image'),
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-6 text-gray-800">Settings</h1>

      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <h2 className="font-semibold text-sm mb-3">SMTP Settings</h2>
        <form onSubmit={handleSubmit((d) => save.mutate({ key: 'smtp', value: JSON.stringify(d) }))} className="space-y-3">
          {[['smtp_host', 'SMTP Host'], ['smtp_port', 'SMTP Port'], ['smtp_user', 'SMTP User'], ['smtp_pass', 'SMTP Password']].map(([k, l]) => (
            <div key={k}>
              <label className="text-xs text-gray-600 block mb-1">{l}</label>
              <input {...register(k)} defaultValue={settings[k] || ''} className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-green" />
            </div>
          ))}
          <button type="submit" className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark">Save SMTP</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-sm mb-3">Login Page Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => { if (e.target.files[0]) uploadImg.mutate(e.target.files[0]); }}
          className="text-sm"
        />
        {settings.login_image && (
          <img src={`/uploads/settings/${settings.login_image}`} alt="Login" className="mt-3 h-24 rounded border" />
        )}
      </div>
    </div>
  );
}
