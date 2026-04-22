import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import { useResetPassword } from '@/hooks/useAuth';

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

export default function ResetPasswordPage() {
  const { token } = useParams();
  const resetPassword = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit((d) => resetPassword.mutate({ token, password: d.password }))}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <h1 className="text-xl font-bold mb-6 text-center text-vaya-primary">Set New Password</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">New Password</label>
          <input
            {...register('password')}
            type="password"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vaya-green"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">Confirm Password</label>
          <input
            {...register('confirm')}
            type="password"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vaya-green"
          />
          {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
        </div>
        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="w-full bg-vaya-primary text-white py-2 rounded-md hover:bg-vaya-dark disabled:opacity-60 font-medium"
        >
          {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
