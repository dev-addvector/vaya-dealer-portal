import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/hooks/useAuth';

const schema = z.object({ email: z.string().email('Invalid email') });

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f3e5]">
      <div className="bg-white shadow-[0px_2px_15px_rgba(0,0,0,0.22)] rounded-[10px] p-[50px] w-full max-w-[500px]">
        <h1 className="text-[35px] font-normal text-center mb-[30px] mt-[30px] text-[#111]">Forgot Password</h1>

        <form onSubmit={handleSubmit((d) => forgotPassword.mutate(d))} className="px-5">
          <div className="mb-5">
            <label className="block mb-[7px] text-black text-[16px]">Enter Email ID</label>
            <input
              {...register('email')}
              type="email"
              placeholder="mail@domain.com"
              className="w-full h-[60px] bg-white border border-[#C8C8C8] rounded-[3px] px-5 py-[15px] text-[#a4a7ab] text-[15px] outline-none"
            />
            {errors.email && <p className="text-[#e3342f] text-[12px] mt-1">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={forgotPassword.isPending}
            className={`block w-full mt-[30px] px-[30px] py-[15px] bg-[#007bff] text-white border-none rounded-[4px] text-[16px] ${forgotPassword.isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            {forgotPassword.isPending ? 'Sending...' : 'Get Reset Link'}
          </button>
        </form>

        <p className="text-center mt-5 text-[14px]">
          <Link to="/login" className="text-vaya-green no-underline">Back to Login</Link>
        </p>

        {forgotPassword.isSuccess && (
          <p className="text-[#28a745] text-center mt-3 text-[14px]">Reset link sent! Check your email.</p>
        )}
      </div>
    </div>
  );
}
