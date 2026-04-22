import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getSettings, saveMaxReserveDays } from '@/api/admin.api';
import toast from 'react-hot-toast';

export default function MaxReserveDaysPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings });
  const settings = data?.data ?? {};

  const { register, handleSubmit } = useForm();

  const save = useMutation({
    mutationFn: saveMaxReserveDays,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('Setting saved'); },
    onError: (err) => toast.error(err.message || 'Failed to save'),
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6 text-gray-800">Maximum Reserve Days</h1>
      <div className="bg-white rounded-lg shadow p-5">
        <p className="text-sm text-gray-500 mb-4">
          Set the maximum number of days a customer can reserve an order.
        </p>
        <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Receiving Order Days</label>
            <input
              {...register('receiving_order_days', { required: true, min: 0, valueAsNumber: true })}
              defaultValue={settings.receiving_order_days ?? 7}
              type="number"
              min="0"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary"
            />
          </div>
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-vaya-primary text-white px-5 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-60"
          >
            {save.isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
