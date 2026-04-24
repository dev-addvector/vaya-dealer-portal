import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { resetAuthPassword } from '@/api/profile.api';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import toast from 'react-hot-toast';

export default function ResetAuthPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const reset = useMutation({
    mutationFn: resetAuthPassword,
    onSuccess: () => { toast.success('Authorization password updated'); setPassword(''); setConfirm(''); },
    onError: (err) => toast.error(err.message || 'Failed to update password'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    reset.mutate({ new_password: password });
  };

  return (
    <div>
      <div className="border-b border-[rgba(112,112,112,0.2)] py-[5px]">
        <div className="max-w-[90%] mx-auto px-[15px]">
          <span className="text-vaya-green text-[28px] leading-[43px]">My Profile</span>
        </div>
      </div>

      <section>
        <div className="max-w-[90%] mx-auto px-[15px] pt-[30px] pb-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-[260px] shrink-0 order-1 lg:order-2">
              <ProfileSidebar />
            </div>

            <div className="flex-1 min-w-0 w-full order-2 lg:order-1">
              <div className="bg-white shadow-[0_2px_15px_rgba(0,0,0,0.22)] rounded-[10px] py-6 sm:py-7 px-5 sm:px-8">
                <div className="border-b border-[rgba(112,112,112,0.15)] pb-[14px] mb-6">
                  <h4 className="text-[18px] font-medium text-vaya-black m-0">Reset Authorization Password</h4>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-5 max-w-[360px]">
                    <label className="block mb-[6px] text-sm text-[#111]">Password Type</label>
                    <select
                      disabled
                      className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none bg-[#f5f5f5]"
                    >
                      <option>Authorization Password</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-[30px]">
                    <div>
                      <label className="block mb-[6px] text-sm text-[#111]">
                        Password<span className="text-[#dc3545]">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-[6px] text-sm text-[#111]">
                        Re-Enter Password<span className="text-[#dc3545]">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-center border-t-2 border-[#111] pt-4 max-w-[360px]">
                    <button
                      type="submit"
                      disabled={reset.isPending}
                      className="bg-transparent border-none cursor-pointer text-[15px] font-semibold text-[#111]"
                    >
                      {reset.isPending ? 'Updating...' : 'Reset Now'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
