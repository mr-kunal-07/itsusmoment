import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fdf6e3]/80 text-[#1f2a1f]/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <a href="/" className="flex items-center gap-1">
            <img src="/favicon.ico" alt="usMoment" className="w-8 h-8" />
            <span className=" text-md font-semibold text-[#1f2a1f]">usMoment</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#5f6f5f] hover:text-[#1f2a1f] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="/auth">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#5f6f5f]"
              >
                Log in
              </Button>
            </a>

            <a href="/auth">
              <Button
                size="sm"
                className="bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-[#fef9ec] border-0 shadow-[0_4px_20px_-4px_rgba(192,106,43,0.15)]"
              >
                Start free →
              </Button>
            </a>
          </div>

          <button
            className="md:hidden text-[#1f2a1f]"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden bg-[#fdf6e3] pb-4 border-t border-[rgba(216,207,194,0.5)] mt-2 pt-4 flex flex-col gap-3">

            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#5f6f5f] px-2 py-1"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <a href="/auth" className="mt-2">
              <Button
                size="sm"
                className="w-full bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-[#fef9ec] border-0"
              >
                Start free →
              </Button>
            </a>

          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
