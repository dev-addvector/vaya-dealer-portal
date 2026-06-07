import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getSettings, saveSMTP } from '@/api/admin.api';
import toast from 'react-hot-toast';

export default function SmtpSettingPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings });
  const settings = data?.data ?? {};

  const { register, handleSubmit } = useForm();
  const [showPass, setShowPass] = useState(false);

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
            <div className="relative">
              <input
                {...register('smtp_pass')}
                defaultValue={settings.smtp_pass || ''}
                type={showPass ? 'text' : 'password'}
                placeholder="Leave blank to keep current password"
                className="w-full border rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPass ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.95 9.95 0 016.465 2.37M15 12a3 3 0 11-4.243-4.243M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-vaya-primary text-white px-5 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-60 w-full sm:w-auto"
          >
            {save.isPending ? 'Saving...' : 'Save SMTP Setting'}
          </button>
        </form>
      </div>
    </div>
  );
}
