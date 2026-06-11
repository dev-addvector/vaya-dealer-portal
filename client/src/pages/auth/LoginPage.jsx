import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';
import Footer from '@/components/ui/Footer';

const responsiveStyles = `
  .login-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    overflow-y: auto;
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
  .login-field-password { margin-bottom: 20px; }
  .login-remember-row { margin-bottom: 25px; }
  .login-image-panel { display: none; }

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
    }
    .login-title-wrap { max-width: 100%; margin-bottom: 20px; }
    .login-form-inner {
      width: 100%;
      max-width: 100%;
      padding: 24px 20px 20px;
    }
    .login-field-email { margin-bottom: 18px; }
    .login-field-password { margin-bottom: 14px; }
    .login-remember-row { margin-bottom: 20px; }
  }
`;

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
  remember: z.boolean().optional(),
});

function EyeIcon({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#a4a7ab" viewBox="0 0 16 16">
      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#a4a7ab" viewBox="0 0 16 16">
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.708zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
    </svg>
  );
}

export default function LoginPage() {
  const login = useLogin();
  const [showPwd, setShowPwd] = useState(false);
  const [loginImage, setLoginImage] = useState('/images/login_left_banner.png');

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
            {/* Logo */}
            <div className="header-logo-wrap flex-1 flex items-center justify-center md:justify-start px-[30px]">
              <img src="/images/logo.png" alt="Vaya" className="h-7 object-contain block" />
            </div>
            {/* Dealer Portal + Support — hidden on mobile */}
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
          {/* Form panel */}
          <div className="login-form-panel">

            <div className="login-title-wrap">
              {/* <div className="w-8 h-[3px] bg-[#807A52] mb-3" /> */}
              <h1 className="text-[35px] font-normal m-0 text-white">Dealer Login</h1>
              <p className="m-0 mt-2 text-[15px] text-white/80 leading-[1.5]">Welcome back! Please login to access<br />your dealer account.</p>
            </div>

            <div className="login-form-inner">
              <form onSubmit={handleSubmit((d) => login.mutate(d))}>
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

                <div className="login-field-password">
                  <label className="block mb-[7px] text-black text-[16px] leading-[140%]">Password</label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Min. 8 Characters"
                      className="w-full h-[46px] bg-white border border-[#C8C8C8] rounded-[3px] px-5 pr-[48px] py-[10px] text-[#a4a7ab] text-[15px] outline-none"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-[14px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                    >
                      <EyeIcon visible={showPwd} />
                    </button>
                  </div>
                  {errors.password && <p className="text-[#e3342f] text-[12px] mt-1">{errors.password.message}</p>}
                </div>

                <div className="login-remember-row flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-[#333]">
                    <input {...register('remember')} type="checkbox" className="w-4 h-4 cursor-pointer" />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="text-[#807A52] text-sm no-underline">
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={login.isPending}
                  className={`block w-full px-[30px] py-2 bg-[#807A52] text-white border-none text-[18px] font-normal tracking-[0.5px] ${login.isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {login.isPending ? 'Signing in...' : 'Sign In'}
                </button>

                {login.isError && (
                  <p className="text-[#e3342f] text-sm mt-3 text-center">
                    {login.error?.message || 'Invalid credentials. Please try again.'}
                  </p>
                )}
              </form>
            </div>

          </div>

        </div>

        <Footer />
      </div>
    </>
  );
}
