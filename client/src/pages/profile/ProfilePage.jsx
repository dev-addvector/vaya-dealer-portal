import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/api/profile.api';
import { container, breadcrumb } from '@/styles/page';
import ProfileSidebar from '@/components/profile/ProfileSidebar';

const card = { background: '#fff', boxShadow: '0 2px 15px #00000038', borderRadius: '10px', padding: '28px 32px' };
const labelStyle = { color: 'rgba(0,0,0,0.45)', fontSize: '14px', paddingRight: '8px', width: '180px', flexShrink: 0 };
const valueStyle = { color: '#111', fontSize: '14px', fontWeight: 500 };
const rowStyle = { display: 'flex', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(112,112,112,0.12)' };

export default function ProfilePage() {
  const { data } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const user = data?.data;
  const [showModal, setShowModal] = useState(false);

  const left = [
    ['Unique Consignee Number', user?.unc],
    ['Consignee Name', user?.name],
    ['GST/TAX ID', user?.gstTaxId],
    ['Length Unit', user?.lengthUnit],
    ['Currency', user?.currency],
    ['Consignee Country', user?.consigneeCountry],
  ];
  const right = [
    ['Customer Code', user?.customerCode],
    ['Payment Terms', user?.paymentTerms],
    ['Email ID', user?.erpEmail || user?.email],
    ['Accounting Email ID', user?.erpEmail || user?.email],
    ['Consignee Address', user?.consigneeAddress],
    ['Status', user?.erpStatus || (user ? 'Active' : '')],
  ];

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
            {/* Main card */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(112,112,112,0.15)', paddingBottom: '14px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 500, color: '#111', margin: 0 }}>Consignee Details</h4>
                  <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '16px', padding: '4px' }} title="Request changes">
                    ✎
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                  <div>
                    {left.map(([label, value]) => (
                      <div key={label} style={rowStyle}>
                        <span style={labelStyle}>{label}:</span>
                        <span style={valueStyle}>{value || ''}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    {right.map(([label, value]) => (
                      <div key={label} style={rowStyle}>
                        <span style={labelStyle}>{label}:</span>
                        <span style={{ ...valueStyle, color: label === 'Status' ? '#AEC148' : '#111' }}>
                          {value || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ width: '260px', flexShrink: 0 }}>
              <ProfileSidebar />
            </div>
          </div>
        </div>
      </section>

      {/* Change Request Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '420px', maxWidth: '90vw', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>×</button>
            <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>To Admin,</h4>
            <textarea
              rows={5}
              placeholder="Please change my GST/TAX ID to '2AWER3425'"
              style={{ width: '100%', border: '1px solid #C8C8C8', borderRadius: '4px', padding: '10px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, borderBottom: '2px solid #111', paddingBottom: '2px' }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
