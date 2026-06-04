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
            <div className="relative">
              <input
                {...register('email')}
                type="email"
                placeholder="mail@domain.com"
                className="w-full h-[60px] bg-white border border-[#C8C8C8] rounded-[3px] px-5 pr-12 py-[15px] text-[#a4a7ab] text-[15px] outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 group">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#a4a7ab"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="cursor-pointer"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2" />
                  <line x1="12" y1="11" x2="12" y2="16" />
                </svg>
                <div className="absolute right-0 top-7 z-10 hidden group-hover:block bg-white border border-[#C8C8C8] shadow-md rounded-[4px] px-3 py-2 text-[13px] text-[#555] whitespace-nowrap">
                  Please enter your registered email id
                </div>
              </div>
            </div>
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
