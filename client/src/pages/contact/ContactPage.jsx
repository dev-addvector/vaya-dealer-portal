import { useState } from 'react';
import { useContacts, useAddContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts';
import { container, breadcrumb } from '@/styles/page';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import toast from 'react-hot-toast';

const card = { background: '#fff', boxShadow: '0 2px 15px #00000038', borderRadius: '10px', padding: '28px 32px' };
const inputStyle = {
  width: '100%', height: '45px', border: '1px solid #C8C8C8', borderRadius: '4px',
  padding: '8px 14px', fontSize: '14px', color: '#333', outline: 'none', boxSizing: 'border-box',
};
const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '14px', color: '#111' };

const EMPTY = { name: '', phone: '', email: '', department: '' };

function ContactModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) return toast.error('Name, Contact Number and Email are required');
    onSave(form);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '460px', maxWidth: '92vw', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: '1px solid #ccc', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        <h4 style={{ fontSize: '20px', fontWeight: 600, textAlign: 'center', marginBottom: '24px' }}>{initial ? 'Edit Contact' : 'Add Contact'}</h4>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Name<span style={{ color: '#dc3545' }}>*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} placeholder="Name" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Contact Number<span style={{ color: '#dc3545' }}>*</span></label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} placeholder="Contact Number" type="tel" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email ID<span style={{ color: '#dc3545' }}>*</span></label>
            <input value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} placeholder="Email ID" type="email" />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Department<span style={{ color: '#dc3545' }}>*</span></label>
            <input value={form.department} onChange={e => set('department', e.target.value)} style={inputStyle} placeholder="Department" />
          </div>
          <div style={{ textAlign: 'center', borderTop: '2px solid #111', paddingTop: '16px' }}>
            <button type="submit" disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, color: '#111' }}>
              {saving ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const { data, isLoading } = useContacts();
  const addContact = useAddContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const contacts = data?.data ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const handleAdd = (form) => {
    addContact.mutate({ name: form.name, phone: form.phone, email: form.email }, {
      onSuccess: () => setShowAdd(false),
    });
  };

  const handleEdit = (form) => {
    updateContact.mutate({ id: editing.id, name: form.name, phone: form.phone, email: form.email }, {
      onSuccess: () => setEditing(null),
    });
  };

  const handleDelete = () => {
    deleteContact.mutate(deleting, { onSuccess: () => setDeleting(null) });
  };

  return (
    <div>
      <div style={breadcrumb.wrap}>
        <div style={container}>
          <span style={breadcrumb.title}>My Contact</span>
        </div>
      </div>

      <section>
        <div style={{ ...container, paddingTop: '30px', paddingBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(112,112,112,0.15)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 500, color: '#111', margin: 0 }}>Reset Default Contact</h4>
                  <button
                    onClick={() => setShowAdd(true)}
                    style={{ background: 'none', border: '1px solid #555', borderRadius: '50px', padding: '4px 14px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#555' }}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>⊕</span> New Contact
                  </button>
                </div>

                {isLoading && <p style={{ color: '#999', fontSize: '14px' }}>Loading...</p>}

                {!isLoading && contacts.length === 0 && (
                  <p style={{ color: '#999', fontSize: '14px', padding: '10px 0' }}>&nbsp;</p>
                )}

                {!isLoading && contacts.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid rgba(112,112,112,0.12)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '14px', color: '#111', marginBottom: '3px' }}>{c.name}</div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '2px' }}>{c.phone}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{c.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', paddingTop: '2px' }}>
                      <button onClick={() => setEditing(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '15px' }} title="Edit">✎</button>
                      <button onClick={() => setDeleting(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '15px' }} title="Delete">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: '260px', flexShrink: 0 }}>
              <ProfileSidebar />
            </div>
          </div>
        </div>
      </section>

      {showAdd && <ContactModal onSave={handleAdd} onClose={() => setShowAdd(false)} saving={addContact.isPending} />}
      {editing && <ContactModal initial={editing} onSave={handleEdit} onClose={() => setEditing(null)} saving={updateContact.isPending} />}

      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '360px', maxWidth: '90vw', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setDeleting(null)} style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: '1px solid #ccc', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', color: '#888' }}>×</button>
            <p style={{ fontSize: '15px', color: '#111', marginBottom: '24px' }}>Do you want to delete contact?</p>
            <button
              onClick={handleDelete}
              disabled={deleteContact.isPending}
              style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
            >
              {deleteContact.isPending ? 'Deleting...' : 'Yes, Delete Contact'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
