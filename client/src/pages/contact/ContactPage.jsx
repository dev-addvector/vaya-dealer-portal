import { useState } from 'react';
import { useContacts, useAddContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import toast from 'react-hot-toast';

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
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[1000] flex items-center justify-center">
      <div className="bg-white rounded-[12px] p-8 w-[460px] max-w-[92vw] relative">
        <button
          onClick={onClose}
          className="absolute top-[14px] right-4 bg-transparent border border-[#ccc] rounded-full w-7 h-7 cursor-pointer text-[16px] text-[#888] flex items-center justify-center"
        >×</button>
        <h4 className="text-[20px] font-semibold text-center mb-6">{initial ? 'Edit Contact' : 'Add Contact'}</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-[6px] text-sm text-[#111]">Name<span className="text-[#dc3545]">*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none" placeholder="Name" />
          </div>
          <div className="mb-4">
            <label className="block mb-[6px] text-sm text-[#111]">Contact Number<span className="text-[#dc3545]">*</span></label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none" placeholder="Contact Number" type="tel" />
          </div>
          <div className="mb-4">
            <label className="block mb-[6px] text-sm text-[#111]">Email ID<span className="text-[#dc3545]">*</span></label>
            <input value={form.email} onChange={e => set('email', e.target.value)} className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none" placeholder="Email ID" type="email" />
          </div>
          <div className="mb-6">
            <label className="block mb-[6px] text-sm text-[#111]">Department<span className="text-[#dc3545]">*</span></label>
            <input value={form.department} onChange={e => set('department', e.target.value)} className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none" placeholder="Department" />
          </div>
          <div className="text-center border-t-2 border-[#111] pt-4">
            <button type="submit" disabled={saving} className="bg-transparent border-none cursor-pointer text-[15px] font-semibold text-[#111]">
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
      <div className="border-b border-[rgba(112,112,112,0.2)] py-[5px]">
        <div className="max-w-[90%] mx-auto px-[15px]">
          <span className="text-vaya-green text-[28px] leading-[43px]">My Contact</span>
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
                <div className="flex justify-between items-center border-b border-[rgba(112,112,112,0.15)] pb-[14px] mb-5">
                  <h4 className="text-[18px] font-medium text-vaya-black m-0">Reset Default Contact</h4>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="bg-transparent border border-[#555] rounded-[50px] px-[14px] py-1 text-[13px] cursor-pointer flex items-center gap-[5px] text-[#555]"
                  >
                    <span className="text-[16px] leading-none">⊕</span> New Contact
                  </button>
                </div>

                {isLoading && <p className="text-[#999] text-sm">Loading...</p>}

                {!isLoading && contacts.length === 0 && (
                  <p className="text-[#999] text-sm py-[10px]">&nbsp;</p>
                )}

                {!isLoading && contacts.map((c) => (
                  <div key={c.id} className="flex justify-between items-start py-[14px] border-b border-[rgba(112,112,112,0.12)]">
                    <div>
                      <div className="font-medium text-sm text-[#111] mb-[3px]">{c.name}</div>
                      <div className="text-[13px] text-[#666] mb-[2px]">{c.phone}</div>
                      <div className="text-[13px] text-[#666]">{c.email}</div>
                    </div>
                    <div className="flex gap-[10px] pt-[2px]">
                      <button onClick={() => setEditing(c)} className="bg-transparent border-none cursor-pointer text-[#888] text-[15px]" title="Edit">✎</button>
                      <button onClick={() => setDeleting(c.id)} className="bg-transparent border-none cursor-pointer text-[#888] text-[15px]" title="Delete">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showAdd && <ContactModal onSave={handleAdd} onClose={() => setShowAdd(false)} saving={addContact.isPending} />}
      {editing && <ContactModal initial={editing} onSave={handleEdit} onClose={() => setEditing(null)} saving={updateContact.isPending} />}

      {deleting && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[1000] flex items-center justify-center">
          <div className="bg-white rounded-[12px] p-8 w-[360px] max-w-[90vw] relative text-center">
            <button
              onClick={() => setDeleting(null)}
              className="absolute top-[14px] right-4 bg-transparent border border-[#ccc] rounded-full w-7 h-7 cursor-pointer text-[16px] text-[#888]"
            >×</button>
            <p className="text-[15px] text-[#111] mb-6">Do you want to delete contact?</p>
            <button
              onClick={handleDelete}
              disabled={deleteContact.isPending}
              className="bg-[#dc3545] text-white border-none rounded-[4px] px-5 py-2 cursor-pointer text-sm font-medium"
            >
              {deleteContact.isPending ? 'Deleting...' : 'Yes, Delete Contact'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
