function IconMail() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-middle mr-[5px]">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-middle mr-[5px]">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.68 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.49 5.49l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f5] border-t border-[#e0e0e0] shrink-0 h-14 md:h-16 flex items-center justify-center">
      <div className="text-center">
        <p className="m-0 text-[13px] text-[#666]">
          <span className="font-bold text-[#807A52] tracking-[0.5px]">VAYA</span>
          {' '}Home By Universal Textile Mills
        </p>
        <p className="m-0 text-[13px] text-[#666]">
          <a href="mailto:sales@vayahome.com" className="text-[#666] no-underline inline-flex items-center">
            <IconMail />sales@vayahome.com
          </a>
          <span className="mx-2">|</span>
          <a href="tel:+918068170500" className="text-[#666] no-underline inline-flex items-center">
            <IconPhone />+91 8068170500
          </a>
        </p>
      </div>
    </footer>
  );
}
