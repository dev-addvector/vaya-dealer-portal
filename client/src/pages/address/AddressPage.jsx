import { useState } from 'react';
import { useAddresses, useAddAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '@/hooks/useAddresses';
import { container, breadcrumb } from '@/styles/page';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import toast from 'react-hot-toast';

const card = { background: '#fff', boxShadow: '0 2px 15px #00000038', borderRadius: '10px', padding: '28px 32px' };
const inputStyle = {
  width: '100%', height: '45px', border: '1px solid #C8C8C8', borderRadius: '4px',
  padding: '8px 14px', fontSize: '14px', color: '#333', outline: 'none', boxSizing: 'border-box',
};
const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '14px', color: '#111' };

const radioStyle = {
  width: '18px', height: '18px', accentColor: '#AEC148', cursor: 'pointer',
};

const EMPTY = { line1: '', city: '', state: '', country: '', pincode: '' };

function AddressModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.line1 || !form.city || !form.state || !form.country || !form.pincode) return toast.error('All fields are required');
    onSave(form);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '500px', maxWidth: '92vw', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: '1px solid #ccc', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        <h4 style={{ fontSize: '18px', fontWeight: 600, textAlign: 'center', marginBottom: '24px' }}>{initial ? 'Edit Address' : 'Add Address'}</h4>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Address<span style={{ color: '#dc3545' }}>*</span></label>
            <textarea
              value={form.line1}
              onChange={e => set('line1', e.target.value)}
              rows={3}
              style={{ ...inputStyle, height: 'auto', resize: 'vertical' }}
              placeholder="Address"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>City<span style={{ color: '#dc3545' }}>*</span></label>
              <input value={form.city} onChange={e => set('city', e.target.value)} style={inputStyle} placeholder="City" />
            </div>
            <div>
              <label style={labelStyle}>State<span style={{ color: '#dc3545' }}>*</span></label>
              <input value={form.state} onChange={e => set('state', e.target.value)} style={inputStyle} placeholder="State" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Country<span style={{ color: '#dc3545' }}>*</span></label>
              <input value={form.country} onChange={e => set('country', e.target.value)} style={inputStyle} placeholder="Country" />
            </div>
            <div>
              <label style={labelStyle}>Pin code<span style={{ color: '#dc3545' }}>*</span></label>
              <input value={form.pincode} onChange={e => set('pincode', e.target.value)} style={inputStyle} placeholder="Pin code" type="text" />
            </div>
          </div>
          <div style={{ textAlign: 'center', borderTop: '2px solid #111', paddingTop: '16px' }}>
            <button type="submit" disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, color: '#111' }}>
              {saving ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddressPage() {
  const { data, isLoading, isError, error } = useAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const addresses = data?.data ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const handleAdd = (form) => {
    addAddress.mutate({ ...form, label: form.line1 }, {
      onSuccess: () => setShowAdd(false),
    });
  };

  const handleEdit = (form) => {
    updateAddress.mutate({ ...form, id: editing.id, label: form.line1 }, {
      onSuccess: () => setEditing(null),
    });
  };

  const handleDelete = () => {
    deleteAddress.mutate(deleting, { onSuccess: () => setDeleting(null) });
  };

  const formatAddress = (addr) =>
    [addr.city, addr.state, addr.country, addr.pincode].filter(Boolean).join(', ');

  return (
    <div>
      <div style={breadcrumb.wrap}>
        <div style={container}>
          <span style={breadcrumb.title}>My Address</span>
        </div>
      </div>

      <section>
        <div style={{ ...container, paddingTop: '30px', paddingBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(112,112,112,0.15)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 500, color: '#111', margin: 0 }}>Reset Default Address</h4>
                  <button
                    onClick={() => setShowAdd(true)}
                    style={{ background: 'none', border: '1px solid #555', borderRadius: '50px', padding: '4px 14px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#555' }}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>⊕</span> New Address
                  </button>
                </div>

                {isLoading && <p style={{ color: '#999', fontSize: '14px' }}>Loading...</p>}

                {isError && (
                  <p style={{ color: '#dc3545', fontSize: '14px' }}>
                    {error?.message || 'Failed to load addresses. Check server logs.'}
                  </p>
                )}

                {!isLoading && !isError && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '70%' }} />
                        <th style={{ width: '8%' }} />
                        <th style={{ width: '11%', textAlign: 'center', fontSize: '13px', color: '#555', fontWeight: 500, paddingBottom: '10px' }}>
                          Shipping<br />address
                        </th>
                        <th style={{ width: '11%', textAlign: 'center', fontSize: '13px', color: '#555', fontWeight: 500, paddingBottom: '10px' }}>
                          Billing<br />address
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {addresses.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ color: '#999', fontSize: '14px', padding: '16px 0' }}>No addresses found.</td>
                        </tr>
                      )}
                      {addresses.map((addr) => (
                        <tr key={addr.id} style={{ borderBottom: '1px solid rgba(112,112,112,0.12)' }}>
                          <td style={{ padding: '14px 0', fontSize: '14px', color: '#555' }}>
                            <div>{addr.line1}</div>
                            <div style={{ fontSize: '13px', color: '#888' }}>{formatAddress(addr)}</div>
                          </td>
                          <td style={{ padding: '14px 8px' }}>
                            {addr.addressType !== 'Billing' && (
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => setEditing({ ...addr, line1: addr.line1 || addr.label })}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '15px' }}
                                  title="Edit"
                                >✎</button>
                                <button
                                  onClick={() => setDeleting(addr.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '15px' }}
                                  title="Delete"
                                >🗑</button>
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', padding: '14px 0' }}>
                            <input
                              type="radio"
                              name="shipping"
                              checked={addr.isDefault === 1}
                              onChange={() => setDefault.mutate(addr.id)}
                              style={radioStyle}
                            />
                          </td>
                          <td style={{ textAlign: 'center', padding: '14px 0' }}>
                            <input
                              type="radio"
                              name="billing"
                              checked={addr.isBillingDefault === 1}
                              readOnly
                              disabled
                              style={{ ...radioStyle, cursor: 'default', opacity: 0.5 }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ width: '260px', flexShrink: 0 }}>
              <ProfileSidebar />
            </div>
          </div>
        </div>
      </section>

      {showAdd && (
        <AddressModal onSave={handleAdd} onClose={() => setShowAdd(false)} saving={addAddress.isPending} />
      )}
      {editing && (
        <AddressModal initial={editing} onSave={handleEdit} onClose={() => setEditing(null)} saving={updateAddress.isPending} />
      )}

      {/* Delete confirmation modal */}
      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '360px', maxWidth: '90vw', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setDeleting(null)} style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: '1px solid #ccc', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', color: '#888' }}>×</button>
            <p style={{ fontSize: '15px', color: '#111', marginBottom: '24px' }}>Do you want to delete address?</p>
            <button
              onClick={handleDelete}
              disabled={deleteAddress.isPending}
              style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
            >
              {deleteAddress.isPending ? 'Deleting...' : 'Yes, Delete Address'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
