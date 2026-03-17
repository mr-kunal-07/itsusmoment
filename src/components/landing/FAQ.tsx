import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Is usMoment really 100% private?", a: "Absolutely. All messages and notes are end-to-end encrypted using AES-256-GCM. Even our team cannot read your content." },
  { q: "How does the shared plan work?", a: "When either partner upgrades, both get all benefits. One subscription covers both of you completely." },
  { q: "Can I cancel anytime?", a: "Yes. No lock-in periods, no cancellation fees, no hidden charges." },
  { q: "What happens to my data if I cancel?", a: "Your vault stays accessible on the Free plan indefinitely. Nothing is deleted." },
  { q: "Is it available on mobile?", a: "usMoment is a PWA — install from your browser on iOS and Android for a native-like experience." },
  { q: "How is storage calculated?", a: "Both partners share a single storage pool. Both uploads count toward one total." },
];

const FAQ = () => (
  <section id="faq" className="py-12 sm:py-16 md:py-20">
    <div className="max-w-2xl mx-auto px-5 sm:px-6">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <span className="text-xs font-medium text-[#c06a2b] tracking-wider uppercase">
          FAQ
        </span>

        <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#1f2a1f] mt-2">
          Questions you might have.
        </h2>
      </motion.div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((f, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="bg-[rgba(253,246,227,0.8)] backdrop-blur-sm rounded-lg border border-[rgba(216,207,194,0.3)] px-4 data-[state=open]:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]"
          >
            <AccordionTrigger className="text-left font-['Playfair_Display'] text-sm sm:text-base font-semibold text-[#1f2a1f] hover:no-underline py-3">
              {f.q}
            </AccordionTrigger>

            <AccordionContent className="text-xs sm:text-sm text-[#5f6f5f] leading-relaxed pb-3">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="text-center mt-6">
        <a
          href="mailto:hello@usmoment.in"
          className="text-xs sm:text-sm font-medium text-[#c06a2b] hover:underline"
        >
          Still have questions? hello@usmoment.in
        </a>
      </div>

    </div>
  </section>
);

export default FAQ;