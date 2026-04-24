import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/useAuth';
import * as authApi from '@/api/auth.api';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
const PWD_MSG = 'Must be 8–20 chars with uppercase, lowercase, digit, and special character (@$!%*?&)';

const schema = z
  .object({
    email: z.string().email('Invalid email'),
    accountingEmail: z.string().optional(),
    password: z.string().regex(PASSWORD_REGEX, PWD_MSG),
    confirmPassword: z.string().min(1, 'Required'),
    authorizationPassword: z.string().regex(PASSWORD_REGEX, PWD_MSG),
    confirmAuthPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.authorizationPassword === d.confirmAuthPassword, {
    message: 'Passwords do not match',
    path: ['confirmAuthPassword'],
  });

function EyeIcon({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#a4a7ab" viewBox="0 0 16 16">
      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#a4a7ab" viewBox="0 0 16 16">
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.708zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
    </svg>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="mb-4">
      <label className="block mb-[6px] text-black text-[14px] leading-[140%]">{label}</label>
      <div className="w-full min-h-[48px] bg-[#f5f5f5] border border-[#C8C8C8] rounded-[3px] px-4 py-[11px] text-[#555] text-[14px] break-words">
        {value || '—'}
      </div>
    </div>
  );
}

function PasswordField({ label, register: reg, name, error, showState, toggleShow }) {
  return (
    <div className="mb-4">
      <label className="block mb-[6px] text-black text-[15px] leading-[140%]">{label}</label>
      <div className="relative">
        <input
          {...reg(name)}
          type={showState ? 'text' : 'password'}
          placeholder="Min. 8 Characters"
          className="w-full h-[52px] bg-white border border-[#C8C8C8] rounded-[3px] px-4 pr-[44px] text-[#333] text-[14px] outline-none"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
        >
          <EyeIcon visible={showState} />
        </button>
      </div>
      {error && <p className="text-[#e3342f] text-[12px] mt-1">{error.message}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const { encrypted_unc, key_phrase } = useParams();
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [erpData, setErpData] = useState(null);
  const [unc, setUnc] = useState('');
  const [keyPhrase, setKeyPhrase] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const emailCheckTimeout = useRef(null);

  const [show, setShow] = useState({ pwd: false, confirmPwd: false, authPwd: false, confirmAuthPwd: false });
  const toggleShow = (key) => setShow((s) => ({ ...s, [key]: !s[key] }));

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    authApi.getRegisterInfo(encrypted_unc, key_phrase)
      .then((res) => {
        setErpData(res.erpData);
        setUnc(res.unc);
        setKeyPhrase(res.keyPhrase);
        setValue('email', res.erpData.erpEmail || '');
      })
      .catch((err) => {
        if (err?.response?.data?.redirect) {
          navigate('/login', { replace: true });
        } else {
          setError(err?.response?.data?.message || 'Invalid or expired invite link');
        }
      })
      .finally(() => setLoading(false));
  }, [encrypted_unc, key_phrase, navigate, setValue]);

  const handleEmailBlur = async (e) => {
    const email = e.target.value;
    if (!email) return;
    clearTimeout(emailCheckTimeout.current);
    emailCheckTimeout.current = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await authApi.checkEmail(email);
        setEmailExists(res.exists);
      } catch (_) {}
      finally { setCheckingEmail(false); }
    }, 400);
  };

  const onSubmit = (data) => {
    if (emailExists) return;
    registerMutation.mutate({
      unc,
      keyPhrase,
      email: data.email,
      accountingEmail: data.accountingEmail,
      password: data.password,
      authorizationPassword: data.authorizationPassword,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-[#555] text-[15px]">Loading invite details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-[#e3342f] text-[16px] mb-4">{error}</p>
          <button onClick={() => navigate('/login')} className="text-sm underline text-[#333]">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#E3E8CC', boxShadow: '0px 1px 3px #00000029', height: 64, flexShrink: 0 }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px' }}>
          <img src="/images/logo.png" alt="Vaya" style={{ height: 28, objectFit: 'contain' }} />
          <span style={{ fontSize: 22, color: '#222', fontWeight: 400 }}>Dealer Portal</span>
          <div style={{ width: 80 }} />
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 16px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, marginBottom: 8, color: '#111' }}>Account Setup</h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 32 }}>
            Please verify your details and set your passwords to complete registration.
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '0 40px' }}>

              {/* Left column — ERP read-only data */}
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#807A52', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Dealer Information
                </h2>
                <ReadOnlyField label="Consignee Name" value={erpData?.customerName} />
                <ReadOnlyField label="Unique Consignee Number" value={unc} />
                <ReadOnlyField label="Customer Code" value={erpData?.customerCode} />
                <ReadOnlyField label="GST / TAX ID" value={erpData?.gstTaxId} />
                <ReadOnlyField label="Currency" value={erpData?.currency} />
                <ReadOnlyField label="Length Unit" value={erpData?.lengthUnit} />
                <ReadOnlyField label="Payment Terms" value={erpData?.paymentTerms} />
                <ReadOnlyField label="Consignee Address" value={erpData?.consigneeAddress} />
                <ReadOnlyField label="Consignee Country" value={erpData?.consigneeCountry} />
                <ReadOnlyField label="Status" value={erpData?.erpStatus} />
              </div>

              {/* Right column — user input */}
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#807A52', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Account Credentials
                </h2>

                {/* Email */}
                <div className="mb-4">
                  <label className="block mb-[6px] text-black text-[15px] leading-[140%]">Email ID</label>
                  <input
                    {...register('email')}
                    type="email"
                    onBlur={handleEmailBlur}
                    className="w-full h-[52px] bg-white border border-[#C8C8C8] rounded-[3px] px-4 text-[#333] text-[14px] outline-none"
                    autoComplete="off"
                  />
                  {errors.email && <p className="text-[#e3342f] text-[12px] mt-1">{errors.email.message}</p>}
                  {checkingEmail && <p className="text-[#888] text-[12px] mt-1">Checking email…</p>}
                  {!checkingEmail && emailExists && (
                    <p className="text-[#e3342f] text-[12px] mt-1">This email is already registered</p>
                  )}
                </div>

                {/* Shipping Notification Emails */}
                <div className="mb-4">
                  <label className="block mb-[6px] text-black text-[15px] leading-[140%]">
                    Shipping Notification Email(s)
                    <span className="text-[12px] text-[#888] ml-2">comma-separated</span>
                  </label>
                  <input
                    {...register('accountingEmail')}
                    type="text"
                    placeholder="e.g. accounts@co.com, logistics@co.com"
                    className="w-full h-[52px] bg-white border border-[#C8C8C8] rounded-[3px] px-4 text-[#333] text-[14px] outline-none"
                    autoComplete="off"
                  />
                </div>

                <div style={{ borderTop: '1px solid #e5e5e5', margin: '20px 0' }} />

                <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                  <strong>Primary Password</strong> — used to log in
                </p>

                <PasswordField
                  label="Primary Password"
                  register={register}
                  name="password"
                  error={errors.password}
                  showState={show.pwd}
                  toggleShow={() => toggleShow('pwd')}
                />
                <PasswordField
                  label="Confirm Primary Password"
                  register={register}
                  name="confirmPassword"
                  error={errors.confirmPassword}
                  showState={show.confirmPwd}
                  toggleShow={() => toggleShow('confirmPwd')}
                />

                <div style={{ borderTop: '1px solid #e5e5e5', margin: '20px 0' }} />

                <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                  <strong>Authorization Password</strong> — required at order confirmation
                </p>

                <PasswordField
                  label="Authorization Password"
                  register={register}
                  name="authorizationPassword"
                  error={errors.authorizationPassword}
                  showState={show.authPwd}
                  toggleShow={() => toggleShow('authPwd')}
                />
                <PasswordField
                  label="Confirm Authorization Password"
                  register={register}
                  name="confirmAuthPassword"
                  error={errors.confirmAuthPassword}
                  showState={show.confirmAuthPwd}
                  toggleShow={() => toggleShow('confirmAuthPwd')}
                />

                <button
                  type="submit"
                  disabled={registerMutation.isPending || emailExists}
                  className={`block w-full px-[30px] py-3 bg-black text-white border-none text-[18px] font-normal tracking-[0.5px] mt-6 ${
                    registerMutation.isPending || emailExists ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                >
                  {registerMutation.isPending ? 'Setting up account…' : 'Complete Registration'}
                </button>

                {registerMutation.isError && (
                  <p className="text-[#e3342f] text-sm mt-3 text-center">
                    {registerMutation.error?.message || 'Registration failed. Please try again.'}
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#f5f5f5', borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#666' }}>VAYA Home By Universal Textile Mills</p>
          <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
            Customer Care :{' '}
            <a href="mailto:sales@vayahome.com" style={{ color: '#666' }}>sales@vayahome.com</a>
            {' | '}
            <a href="tel:+918068170500" style={{ color: '#666' }}>+91 8068170500</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
