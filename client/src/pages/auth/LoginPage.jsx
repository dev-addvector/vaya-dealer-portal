import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
  remember: z.boolean().optional(),
});

const inputStyle = {
  width: '100%',
  height: '60px',
  background: '#FFFFFF',
  border: '1px solid #C8C8C8',
  borderRadius: '3px',
  padding: '15px 20px',
  color: '#a4a7ab',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  marginBottom: '7px',
  color: '#000000',
  fontSize: '16px',
  lineHeight: '140%',
};

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>

      {/* Header */}
      <header style={{ backgroundColor: '#E3E8CC', boxShadow: '0px 1px 3px #00000029', width: '100%', height: '90px', flexShrink: 0 }}>
        <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '100%' }}>
          <div style={{ width: '33%', padding: '20px 30px' }}>
            <img src="/images/logo.png" alt="Vaya" style={{ height: '40px', objectFit: 'contain', display: 'block' }} />
          </div>
          <div style={{ width: '33%', textAlign: 'center' }}>
            <span style={{ fontSize: '25px', color: '#111111', fontWeight: 400 }}>Dealer Portal</span>
          </div>
          <div style={{ width: '33%' }} />
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex' }}>

        {/* Left: Form */}
        <div style={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: '480px' }}>

            <div style={{ marginBottom: '40px' }}>
              <h1 style={{ fontSize: '35px', fontWeight: 400, margin: 0, color: '#111111' }}>Dealer Login</h1>
            </div>

            <form onSubmit={handleSubmit((d) => login.mutate(d))}>
              <div style={{ marginBottom: '25px' }}>
                <label style={labelStyle}>Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="mail@domain.com"
                  style={inputStyle}
                  autoComplete="off"
                />
                {errors.email && <p style={{ color: '#e3342f', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</p>}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('password')}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Min. 8 Characters"
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <EyeIcon visible={showPwd} />
                  </button>
                </div>
                {errors.password && <p style={{ color: '#e3342f', fontSize: '12px', marginTop: '4px' }}>{errors.password.message}</p>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', color: '#333' }}>
                  <input {...register('remember')} type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  Remember me
                </label>
                <Link to="/forgot-password" style={{ color: '#000000', fontSize: '14px', textDecoration: 'none' }}>
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={login.isPending}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 30px',
                  backgroundColor: 'transparent',
                  color: '#111111',
                  border: 'none',
                  borderBottom: '2px solid #000000',
                  fontSize: '21px',
                  fontWeight: 400,
                  cursor: login.isPending ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.5px',
                }}
              >
                {login.isPending ? 'Signing in...' : 'Submit'}
              </button>

              {login.isError && (
                <p style={{ color: '#e3342f', fontSize: '14px', marginTop: '12px', textAlign: 'center' }}>
                  {login.error?.message || 'Invalid credentials. Please try again.'}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Right: Image */}
        <div
          style={{
            width: '50%',
            backgroundImage: `url(${loginImage})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            minHeight: '400px',
          }}
        />
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#f5f5f5', borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#666' }}>VAYA Home By Universal Textile Mills</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Customer Care :{' '}
            <a href="mailto:sales@vayahome.com" style={{ color: '#666', textDecoration: 'none' }}>sales@vayahome.com</a>
            {' | '}
            <a href="tel:+918068170500" style={{ color: '#666', textDecoration: 'none' }}>+91 8068170500</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
