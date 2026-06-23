import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/hooks/useAuth';
import Footer from '@/components/ui/Footer';

const responsiveStyles = `
  .login-wrapper {
    height: 100vh;
    height: 100svh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    overflow: hidden;
  }
  .login-header {
    background-color: #ffffff;
    box-shadow: 0px 1px 3px #00000029;
    width: 100%;
    height: 56px;
    flex-shrink: 0;
  }
  .login-header-inner {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 100%;
  }
  @media (min-width: 768px) {
    .login-header { height: 64px; }
    .login-header-inner { height: 64px; }
  }
  .login-body {
    flex: 1;
    display: flex;
    position: relative;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    overflow-y: auto;
  }
  .login-body::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.82) 22%, rgba(0,0,0,0.45) 52%, rgba(0,0,0,0.1) 72%);
    pointer-events: none;
    z-index: 0;
  }
  .login-form-panel {
    width: 50%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 40px 60px;
    position: relative;
    z-index: 1;
  }
  .login-title-wrap {
    width: 100%;
    max-width: 480px;
    margin-bottom: 24px;
  }
  .login-form-inner {
    width: 100%;
    max-width: 480px;
    background: #fff;
    padding: 28px 32px 24px;
    border-radius: 6px;
  }
  .login-field-email { margin-bottom: 25px; }

  /* 14-inch laptop (≤1440px) */
  @media (min-width: 768px) and (max-width: 1440px) {
    .login-form-panel {
      padding: 28px 40px;
    }
    .login-title-wrap {
      max-width: 360px;
      margin-bottom: 16px;
    }
    .login-title-wrap h1 { font-size: 26px !important; }
    .login-title-wrap p  { font-size: 13px !important; }
    .login-form-inner {
      max-width: 360px;
      padding: 20px 24px 18px;
    }
    .login-form-inner label   { font-size: 13px !important; }
    .login-form-inner input   { height: 40px !important; font-size: 13px !important; }
    .login-form-inner button[type="submit"] { font-size: 15px !important; }
    .login-field-email { margin-bottom: 18px; }
  }

  /* Mobile */
  @media (max-width: 767px) {
    .login-body::before {
      background: rgba(0, 0, 0, 0.55);
    }
    .login-header-inner { justify-content: center; }
    .header-logo-wrap { width: auto !important; padding: 0 !important; }
    .login-form-panel {
      width: 100%;
      padding: 32px 20px 24px;
      align-items: flex-start;
      justify-content: center;
      margin: auto 0;
    }
    .login-title-wrap { max-width: 100%; margin-bottom: 20px; }
    .login-form-inner {
      width: 100%;
      max-width: 100%;
      padding: 24px 20px 20px;
    }
    .login-field-email { margin-bottom: 18px; }
  }
`;

const schema = z.object({ email: z.string().email('Invalid email') });

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [loginImage, setLoginImage] = useState('/images/login_left_banner.webp');

  useEffect(() => {
    fetch('/api/auth/login-image')
      .then((r) => r.json())
      .then((d) => { if (d.image) setLoginImage(d.image); })
      .catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  return (
    <>
      <style>{responsiveStyles}</style>
      <div className="login-wrapper">

        {/* Header */}
        <header className="login-header">
          <div className="login-header-inner">
            <div className="header-logo-wrap flex-1 flex items-center justify-center md:justify-start px-[30px]">
              <img src="/images/logo.png" alt="Vaya" className="h-7 object-contain block" />
            </div>
            <div className="hidden md:flex items-center gap-6 px-[30px]">
              <span className="text-[22px] text-vaya-black font-normal">Dealer Portal</span>
              <a
                href="mailto:sales@vayahome.com"
                className="flex items-center gap-[6px] text-vaya-black no-underline text-[15px] opacity-70 hover:opacity-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#807A52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
                  <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                </svg>
                <span>Support</span>
              </a>
            </div>
          </div>
        </header>

        {/* Body */}
        <div
          className="login-body"
          style={{ backgroundImage: `url(${loginImage})` }}
        >
          <div className="login-form-panel">

            <div className="login-title-wrap">
              <h1 className="text-[35px] font-normal m-0 text-white">Forgot Password</h1>
              <p className="m-0 mt-2 text-[14px] text-white/80 leading-[1.5]">Enter your registered email address<br />to receive a password reset link.</p>
            </div>

            <div className="login-form-inner">
              <form onSubmit={handleSubmit((d) => forgotPassword.mutate(d))}>
                <div className="login-field-email">
                  <label className="block mb-[7px] text-black text-[16px] leading-[140%]">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="mail@domain.com"
                    className="w-full h-[46px] bg-white border border-[#C8C8C8] rounded-[3px] px-5 py-[10px] text-[#a4a7ab] text-[15px] outline-none"
                    autoComplete="off"
                  />
                  {errors.email && <p className="text-[#e3342f] text-[12px] mt-1">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={forgotPassword.isPending}
                  className={`block w-full px-[30px] py-2 bg-[#807A52] text-white border-none text-[18px] font-normal tracking-[0.5px] ${forgotPassword.isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {forgotPassword.isPending ? 'Sending...' : 'Get Reset Link'}
                </button>

                {forgotPassword.isSuccess && (
                  <p className="text-[#28a745] text-sm mt-3 text-center">Reset link sent! Check your email.</p>
                )}

                {forgotPassword.isError && (
                  <p className="text-[#e3342f] text-sm mt-3 text-center">
                    {forgotPassword.error?.message || 'Something went wrong. Please try again.'}
                  </p>
                )}
              </form>

              <p className="text-center mt-5 mb-0 text-[14px]">
                <Link to="/login" className="text-[#807A52] no-underline">Back to Login</Link>
              </p>
            </div>

          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
