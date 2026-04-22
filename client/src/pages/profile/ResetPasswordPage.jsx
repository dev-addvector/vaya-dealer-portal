import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { resetLoginPassword } from '@/api/profile.api';
import { container, breadcrumb } from '@/styles/page';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import toast from 'react-hot-toast';

const card = { background: '#fff', boxShadow: '0 2px 15px #00000038', borderRadius: '10px', padding: '28px 32px' };
const inputStyle = {
  width: '100%', height: '45px', border: '1px solid #C8C8C8', borderRadius: '4px',
  padding: '8px 14px', fontSize: '14px', color: '#333', outline: 'none', boxSizing: 'border-box',
};
const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '14px', color: '#111' };

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const reset = useMutation({
    mutationFn: resetLoginPassword,
    onSuccess: () => { toast.success('Password updated'); setPassword(''); setConfirm(''); },
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
      <div style={breadcrumb.wrap}>
        <div style={container}>
          <span style={breadcrumb.title}>My Profile</span>
        </div>
      </div>

      <section>
        <div style={{ ...container, paddingTop: '30px', paddingBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={card}>
                <div style={{ borderBottom: '1px solid rgba(112,112,112,0.15)', paddingBottom: '14px', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 500, color: '#111', margin: 0 }}>Reset Password</h4>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px', maxWidth: '360px' }}>
                    <label style={labelStyle}>Password Type</label>
                    <select disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5', color: '#333' }}>
                      <option>Primary Password</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div>
                      <label style={labelStyle}>Password<span style={{ color: '#dc3545' }}>*</span></label>
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Re-Enter Password<span style={{ color: '#dc3545' }}>*</span></label>
                      <input
                        type="password"
                        placeholder="Password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', borderTop: '2px solid #111', paddingTop: '16px', maxWidth: '360px' }}>
                    <button
                      type="submit"
                      disabled={reset.isPending}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, color: '#111' }}
                    >
                      {reset.isPending ? 'Updating...' : 'Reset Now'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div style={{ width: '260px', flexShrink: 0 }}>
              <ProfileSidebar />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
