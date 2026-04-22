import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getSettings, saveGst } from '@/api/admin.api';
import toast from 'react-hot-toast';

export default function GSTSettingPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings });
  const settings = data?.data ?? {};

  const { register, handleSubmit } = useForm();

  const save = useMutation({
    mutationFn: saveGst,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('GST setting saved'); },
    onError: (err) => toast.error(err.message || 'Failed to save'),
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6 text-gray-800">GST Setting</h1>
      <div className="bg-white rounded-lg shadow p-5">
        <p className="text-sm text-gray-500 mb-4">
          Set the global GST percentage applied to orders. This value is used when an item does not have a specific GST rate.
        </p>
        <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">GST Percentage (%)</label>
            <div className="relative">
              <input
                {...register('gst', { required: true, min: 0, max: 100, valueAsNumber: true })}
                defaultValue={settings.gst ?? 5}
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-vaya-primary text-white px-5 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-60"
          >
            {save.isPending ? 'Saving...' : 'Save GST Setting'}
          </button>
        </form>
      </div>
    </div>
  );
}
