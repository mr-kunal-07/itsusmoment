const Footer = () => (
  <footer className="border-t border-[rgba(216,207,194,0.3)] py-6">
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="usMoment logo" width={36} height={36} className="h-full w-full object-cover" />
        </div>
        <span className="font-['Playfair_Display'] text-sm font-bold text-[#1f2a1f]">
          usMoment
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#5f6f5f]">
        <a href="mailto:hello@usmoment.in" className="transition-colors hover:text-[#1f2a1f]">
          Contact
        </a>
        <a href="#features" className="transition-colors hover:text-[#1f2a1f]">
          Features
        </a>
        <a href="#pricing" className="transition-colors hover:text-[#1f2a1f]">
          Pricing
        </a>
        <a href="#faq" className="transition-colors hover:text-[#1f2a1f]">
          FAQ
        </a>
      </div>

      <p className="text-center text-[10px] text-[#5f6f5f]">
        © {new Date().getFullYear()} usMoment
      </p>
    </div>
  </footer>
);

export default Footer;
