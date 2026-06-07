import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, uploadLoginImage } from '@/api/admin.api';
import toast from 'react-hot-toast';

export default function LoginImagePage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings });
  const settings = data?.data ?? {};

  const upload = useMutation({
    mutationFn: (file) => {
      const f = new FormData();
      f.append('image', file);
      return uploadLoginImage(f);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); toast.success('Login image updated'); },
    onError: () => toast.error('Upload failed'),
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6 text-gray-800">Login Image</h1>
      <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <p className="text-sm text-gray-500">Upload the image displayed on the login page.</p>
        <div>
          <p className="text-xs text-gray-500 mb-1">Current login page image:</p>
          <img
            src={settings.image ? `/uploads/settings/${settings.image}` : '/images/login_left_banner.png'}
            alt="Current login"
            className="h-32 sm:h-40 rounded border object-cover w-full max-w-xs"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-1">Choose Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const url = URL.createObjectURL(file);
              const img = new Image();
              img.onload = () => {
                URL.revokeObjectURL(url);
                if (img.width !== 721 || img.height !== 808) {
                  toast.error(`Image must be 721 × 808 px. Selected image is ${img.width} × ${img.height} px.`);
                  e.target.value = '';
                  return;
                }
                upload.mutate(file);
              };
              img.src = url;
            }}
            className="text-sm"
            disabled={upload.isPending}
          />
          <p className="text-xs text-gray-400 mt-1">Recommended image size: 721 × 808 px</p>
          {upload.isPending && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
        </div>
      </div>
    </div>
  );
}
