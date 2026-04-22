import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/hooks/useAuth';

const schema = z.object({ email: z.string().email('Invalid email') });

const inputStyle = {
  width: '100%', height: '60px', background: '#FFFFFF',
  border: '1px solid #C8C8C8', borderRadius: '3px',
  padding: '15px 20px', color: '#a4a7ab', fontSize: '15px',
  outline: 'none', boxSizing: 'border-box',
};

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f3e5' }}>
      <div style={{ background: '#fff', boxShadow: '0px 2px 15px #00000038', borderRadius: '10px', padding: '50px', width: '100%', maxWidth: '500px' }}>
        <h1 style={{ fontSize: '35px', fontWeight: 400, textAlign: 'center', marginBottom: '30px', marginTop: '30px', color: '#111' }}>Forgot Password</h1>

        <form onSubmit={handleSubmit((d) => forgotPassword.mutate(d))} style={{ paddingLeft: '20px', paddingRight: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '7px', color: '#000', fontSize: '16px' }}>Enter Email ID</label>
            <input
              {...register('email')}
              type="email"
              placeholder="mail@domain.com"
              style={inputStyle}
            />
            {errors.email && <p style={{ color: '#e3342f', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={forgotPassword.isPending}
            style={{
              display: 'block', width: '100%', marginTop: '30px',
              padding: '15px 30px', backgroundColor: '#007bff', color: '#fff',
              border: 'none', borderRadius: '4px', fontSize: '16px',
              cursor: forgotPassword.isPending ? 'not-allowed' : 'pointer',
              opacity: forgotPassword.isPending ? 0.6 : 1,
            }}
          >
            {forgotPassword.isPending ? 'Sending...' : 'Get Reset Link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#AEC148', textDecoration: 'none' }}>Back to Login</Link>
        </p>

        {forgotPassword.isSuccess && (
          <p style={{ color: '#28a745', textAlign: 'center', marginTop: '12px', fontSize: '14px' }}>Reset link sent! Check your email.</p>
        )}
      </div>
    </div>
  );
}
