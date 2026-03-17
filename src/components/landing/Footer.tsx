const Footer = () => (
  <footer className="py-6 border-t border-[rgba(216,207,194,0.3)]">
    <div className="max-w-5xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">

      <div className="flex items-center gap-1.5">
        <span className="text-base">💛</span>
        <span className="font-['Playfair_Display'] font-bold text-sm text-[#1f2a1f]">
          usMoment
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-[#5f6f5f]">
        <a
          href="mailto:hello@usmoment.in"
          className="hover:text-[#1f2a1f] transition-colors"
        >
          Contact
        </a>
        <a
          href="#features"
          className="hover:text-[#1f2a1f] transition-colors"
        >
          Features
        </a>
        <a
          href="#pricing"
          className="hover:text-[#1f2a1f] transition-colors"
        >
          Pricing
        </a>
        <a
          href="#faq"
          className="hover:text-[#1f2a1f] transition-colors"
        >
          FAQ
        </a>
      </div>

      <p className="text-[10px] text-[#5f6f5f]">
        © {new Date().getFullYear()} usMoment
      </p>

    </div>
  </footer>
);

export default Footer;