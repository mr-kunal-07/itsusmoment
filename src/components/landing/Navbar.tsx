import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Menu, X } from "lucide-react";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(216,207,194,0.8)] bg-[linear-gradient(180deg,rgba(255,250,242,0.98),rgba(248,239,226,0.96))] text-[#1f2a1f]/80 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <a href="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="usMoments logo" width={40} height={40} className="h-full w-full object-cover" />
            </div>

            <div className="min-w-0 leading-none">
              <span className="block truncate text-base font-semibold text-[#1f2a1f]">usMoments</span>
              <span className="hidden text-[10px] uppercase tracking-[0.2em] text-[#5f6f5f] sm:block">
                Private for two
              </span>
            </div>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#5f6f5f] transition-colors hover:text-[#1f2a1f]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a href="/auth">
              <Button variant="ghost" size="sm" className="h-9 rounded-md px-4 text-[#5f6f5f]">
                Log in
              </Button>
            </a>

            <a href="/auth">
              <Button
                size="sm"
                className="h-9 rounded-md border-0 bg-[linear-gradient(135deg,#c06a2b,#caa27a)] px-4 text-[#fef9ec] shadow-[0_8px_24px_-10px_rgba(192,106,43,0.45)]"
              >
                Start free
              </Button>
            </a>
          </div>

          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(216,207,194,0.65)] bg-[rgba(255,251,244,0.7)] text-[#1f2a1f] shadow-sm transition-colors hover:bg-[rgba(255,248,238,0.95)] md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="pb-4 md:hidden">
            <div className="rounded-3xl border border-[rgba(216,207,194,0.55)] bg-[rgba(255,251,244,0.94)] p-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[#c06a2b]/8 px-3 py-2 text-[11px] font-medium text-[#7b4b26]">
                <Lock size={13} className="shrink-0" />
                Private space for couples
              </div>

              <div className="flex flex-col">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="rounded-2xl px-3 py-3 text-sm font-medium text-[#3b463b] transition-colors hover:bg-[#c06a2b]/8"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href="/auth" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="h-10 w-full rounded-md border-[#d7c3af] bg-transparent">
                    Log in
                  </Button>
                </a>
                <a href="/auth" onClick={() => setOpen(false)}>
                  <Button className="h-10 w-full rounded-md border-0 bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-[#fef9ec]">
                    Start free
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
