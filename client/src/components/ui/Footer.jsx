export default function Footer() {
  return (
    <footer className="bg-[#f5f5f5] border-t border-[#e0e0e0] shrink-0 h-14 md:h-16 flex items-center justify-center">
      <div className="text-center">
        <p className="m-0 text-[13px] text-[#666]">VAYA Home By Universal Textile Mills</p>
        <p className="m-0 text-[13px] text-[#666]">
          Customer Care :{' '}
          <a href="mailto:sales@vayahome.com" className="text-[#666] no-underline">sales@vayahome.com</a>
          {' | '}
          <a href="tel:+918068170500" className="text-[#666] no-underline">+91 8068170500</a>
        </p>
      </div>
    </footer>
  );
}
