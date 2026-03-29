import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "What exactly is usMoment?",
    a: "usMoment is a private shared app for couples to keep memories, chat, milestones, and travel moments in one place.",
  },
  {
    q: "Do both partners need separate subscriptions?",
    a: "No. One paid subscription covers both partners after you link your accounts.",
  },
  {
    q: "What is included in the free plan?",
    a: "The free plan includes 1 GB storage, 50 uploads per partner, private chat, milestones, travel map, and the love story card.",
  },
  {
    q: "Are all features private?",
    a: "Yes. It is built as a private couples-only space, and you can add app lock for extra protection.",
  },
  {
    q: "Can I use it on mobile?",
    a: "Yes. usMoment works in the browser and can also be installed as a PWA on mobile and desktop.",
  },
  {
    q: "What happens if I delete a photo or video?",
    a: "Deleted media goes to Recently Deleted first and can be restored for 14 days before permanent cleanup.",
  },
];

const FAQ = () => (
  <section id="faq" className="py-12 sm:py-16 md:py-20">
    <div className="mx-auto max-w-2xl px-5 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-[#c06a2b]">FAQ</span>

        <h2 className="mt-2 font-['Playfair_Display'] text-2xl font-bold text-[#1f2a1f] sm:text-3xl">
          Quick answers.
        </h2>
      </motion.div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((f, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="rounded-lg border border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.8)] px-4 backdrop-blur-sm data-[state=open]:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]"
          >
            <AccordionTrigger className="py-3 text-left font-['Playfair_Display'] text-sm font-semibold text-[#1f2a1f] hover:no-underline sm:text-base">
              {f.q}
            </AccordionTrigger>

            <AccordionContent className="pb-3 text-xs leading-relaxed text-[#5f6f5f] sm:text-sm">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-6 text-center">
        <a
          href="mailto:hello@usmoment.in"
          className="text-xs font-medium text-[#c06a2b] hover:underline sm:text-sm"
        >
          Still have questions? hello@usmoment.in
        </a>
      </div>
    </div>
  </section>
);

export default FAQ;
