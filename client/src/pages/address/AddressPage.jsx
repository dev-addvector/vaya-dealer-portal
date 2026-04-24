import { useState } from 'react';
import { useAddresses, useAddAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '@/hooks/useAddresses';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import toast from 'react-hot-toast';

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
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[1000] flex items-center justify-center">
      <div className="bg-white rounded-[12px] p-8 w-[500px] max-w-[92vw] relative">
        <button
          onClick={onClose}
          className="absolute top-[14px] right-4 bg-transparent border border-[#ccc] rounded-full w-7 h-7 cursor-pointer text-[16px] text-[#888] flex items-center justify-center"
        >×</button>
        <h4 className="text-[18px] font-semibold text-center mb-6">{initial ? 'Edit Address' : 'Add Address'}</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-[6px] text-sm text-[#111]">
              Address<span className="text-[#dc3545]">*</span>
            </label>
            <textarea
              value={form.line1}
              onChange={e => set('line1', e.target.value)}
              rows={3}
              className="w-full border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none resize-y"
              placeholder="Address"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-[6px] text-sm text-[#111]">City<span className="text-[#dc3545]">*</span></label>
              <input value={form.city} onChange={e => set('city', e.target.value)} className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none" placeholder="City" />
            </div>
            <div>
              <label className="block mb-[6px] text-sm text-[#111]">State<span className="text-[#dc3545]">*</span></label>
              <input value={form.state} onChange={e => set('state', e.target.value)} className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none" placeholder="State" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-[6px] text-sm text-[#111]">Country<span className="text-[#dc3545]">*</span></label>
              <input value={form.country} onChange={e => set('country', e.target.value)} className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none" placeholder="Country" />
            </div>
            <div>
              <label className="block mb-[6px] text-sm text-[#111]">Pin code<span className="text-[#dc3545]">*</span></label>
              <input value={form.pincode} onChange={e => set('pincode', e.target.value)} className="w-full h-[45px] border border-[#C8C8C8] rounded-[4px] px-[14px] py-2 text-sm text-[#333] outline-none" placeholder="Pin code" type="text" />
            </div>
          </div>
          <div className="text-center border-t-2 border-[#111] pt-4">
            <button type="submit" disabled={saving} className="bg-transparent border-none cursor-pointer text-[15px] font-semibold text-[#111]">
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
      <div className="border-b border-[rgba(112,112,112,0.2)] py-[5px]">
        <div className="max-w-[90%] mx-auto px-[15px]">
          <span className="text-vaya-green text-[28px] leading-[43px]">My Address</span>
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
                  <h4 className="text-[18px] font-medium text-vaya-black m-0">Reset Default Address</h4>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="bg-transparent border border-[#555] rounded-[50px] px-[14px] py-1 text-[13px] cursor-pointer flex items-center gap-[5px] text-[#555]"
                  >
                    <span className="text-[16px] leading-none">⊕</span> New Address
                  </button>
                </div>

                {isLoading && <p className="text-[#999] text-sm">Loading...</p>}

                {isError && (
                  <p className="text-[#dc3545] text-sm">
                    {error?.message || 'Failed to load addresses. Check server logs.'}
                  </p>
                )}

                {!isLoading && !isError && (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse min-w-[560px]">
                      <thead>
                        <tr>
                          <th className="w-[70%]" />
                          <th className="w-[8%]" />
                          <th className="w-[11%] text-center text-[13px] text-[#555] font-medium pb-[10px]">
                            Shipping<br />address
                          </th>
                          <th className="w-[11%] text-center text-[13px] text-[#555] font-medium pb-[10px]">
                            Billing<br />address
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {addresses.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-[#999] text-sm py-4">No addresses found.</td>
                          </tr>
                        )}
                        {addresses.map((addr) => (
                          <tr key={addr.id} className="border-b border-[rgba(112,112,112,0.12)]">
                            <td className="py-[14px] text-sm text-[#555]">
                              <div>{addr.line1}</div>
                              <div className="text-[13px] text-[#888]">{formatAddress(addr)}</div>
                            </td>
                            <td className="py-[14px] px-2">
                              {addr.addressType !== 'Billing' && (
                                <div className="flex gap-[10px] justify-center">
                                  <button
                                    onClick={() => setEditing({ ...addr, line1: addr.line1 || addr.label })}
                                    className="bg-transparent border-none cursor-pointer text-[#888] text-[15px]"
                                    title="Edit"
                                  >✎</button>
                                  <button
                                    onClick={() => setDeleting(addr.id)}
                                    className="bg-transparent border-none cursor-pointer text-[#888] text-[15px]"
                                    title="Delete"
                                  >🗑</button>
                                </div>
                              )}
                            </td>
                            <td className="text-center py-[14px]">
                              <input
                                type="radio"
                                name="shipping"
                                checked={addr.isDefault === 1}
                                onChange={() => setDefault.mutate(addr.id)}
                                className="w-[18px] h-[18px] accent-vaya-green cursor-pointer"
                              />
                            </td>
                            <td className="text-center py-[14px]">
                              <input
                                type="radio"
                                name="billing"
                                checked={addr.isBillingDefault === 1}
                                readOnly
                                disabled
                                className="w-[18px] h-[18px] accent-vaya-green cursor-default opacity-50"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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

      {deleting && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[1000] flex items-center justify-center">
          <div className="bg-white rounded-[12px] p-8 w-[360px] max-w-[90vw] relative text-center">
            <button
              onClick={() => setDeleting(null)}
              className="absolute top-[14px] right-4 bg-transparent border border-[#ccc] rounded-full w-7 h-7 cursor-pointer text-[16px] text-[#888]"
            >×</button>
            <p className="text-[15px] text-[#111] mb-6">Do you want to delete address?</p>
            <button
              onClick={handleDelete}
              disabled={deleteAddress.isPending}
              className="bg-[#dc3545] text-white border-none rounded-[4px] px-5 py-2 cursor-pointer text-sm font-medium"
            >
              {deleteAddress.isPending ? 'Deleting...' : 'Yes, Delete Address'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
