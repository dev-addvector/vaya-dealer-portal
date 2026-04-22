import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getSettings, saveQrLink, downloadQr } from '@/api/admin.api';
import toast from 'react-hot-toast';

export default function QRSettingPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings });
  const settings = data?.data ?? {};
  const [downloading, setDownloading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const save = useMutation({
    mutationFn: saveQrLink,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('QR link saved'); },
    onError: (err) => toast.error(err.message || 'Failed to save'),
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadQr();
    } catch {
      toast.error('QR download failed. Set a QR link first.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">QR Redirection</h1>
        <button
          onClick={handleDownload}
          disabled={downloading || !settings.qr_link}
          className="bg-vaya-primary text-white px-4 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-50 transition-colors"
        >
          {downloading ? 'Downloading...' : 'Download QR Code'}
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <p className="text-sm text-gray-500 mb-4">
          Set the URL that users are redirected to when they scan the QR code.
        </p>
        <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">QR Redirect URL</label>
            <input
              {...register('qr_link', {
                required: 'URL is required',
                pattern: { value: /^https?:\/\/.+/, message: 'Must be a valid URL starting with http(s)://' },
              })}
              defaultValue={settings.qr_link || ''}
              type="url"
              placeholder="https://example.com"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary"
            />
            {errors.qr_link && <p className="text-xs text-red-500 mt-1">{errors.qr_link.message}</p>}
          </div>
          {settings.qr_link && (
            <p className="text-xs text-gray-400">Current: <span className="text-gray-600">{settings.qr_link}</span></p>
          )}
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-vaya-primary text-white px-5 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-60"
          >
            {save.isPending ? 'Saving...' : 'Save QR Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
