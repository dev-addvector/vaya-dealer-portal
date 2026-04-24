import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/api/profile.api';
import ProfileSidebar from '@/components/profile/ProfileSidebar';

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
      <div className="border-b border-[rgba(112,112,112,0.2)] py-[5px]">
        <div className="max-w-[90%] mx-auto px-[15px]">
          <span className="text-vaya-green text-[28px] leading-[43px]">My Profile</span>
        </div>
      </div>

      <section>
        <div className="max-w-[90%] mx-auto px-[15px] pt-[30px] pb-10">
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <div className="bg-white shadow-[0_2px_15px_rgba(0,0,0,0.22)] rounded-[10px] py-7 px-8">
                <div className="flex justify-between items-center border-b border-[rgba(112,112,112,0.15)] pb-[14px] mb-1">
                  <h4 className="text-[18px] font-medium text-vaya-black m-0">Consignee Details</h4>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-transparent border-none cursor-pointer text-[#555] text-[16px] p-1"
                    title="Request changes"
                  >
                    ✎
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-8">
                  <div>
                    {left.map(([label, value]) => (
                      <div key={label} className="flex items-start py-[10px] border-b border-[rgba(112,112,112,0.12)]">
                        <span className="text-[rgba(0,0,0,0.45)] text-sm pr-2 w-[180px] shrink-0">{label}:</span>
                        <span className="text-[#111] text-sm font-medium">{value || ''}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    {right.map(([label, value]) => (
                      <div key={label} className="flex items-start py-[10px] border-b border-[rgba(112,112,112,0.12)]">
                        <span className="text-[rgba(0,0,0,0.45)] text-sm pr-2 w-[180px] shrink-0">{label}:</span>
                        <span className={`text-sm font-medium ${label === 'Status' ? 'text-vaya-green' : 'text-[#111]'}`}>
                          {value || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-[260px] shrink-0">
              <ProfileSidebar />
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[1000] flex items-center justify-center">
          <div className="bg-white rounded-[12px] p-8 w-[420px] max-w-[90vw] relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-[14px] right-4 bg-transparent border-none text-[20px] cursor-pointer text-[#888]"
            >×</button>
            <h4 className="text-[16px] font-semibold mb-4">To Admin,</h4>
            <textarea
              rows={5}
              placeholder="Please change my GST/TAX ID to '2AWER3425'"
              className="w-full border border-[#C8C8C8] rounded-[4px] p-[10px] text-sm resize-y"
            />
            <div className="text-center mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="bg-transparent border-none cursor-pointer text-[15px] font-semibold border-b-2 border-[#111] pb-[2px]"
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
