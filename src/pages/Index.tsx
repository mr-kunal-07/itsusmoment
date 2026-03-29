import FAQ from "@/components/landing/FAQ"
import FinalCTA from "@/components/landing/FinalCTA"
import Footer from "@/components/landing/Footer"
import Hero from "@/components/landing/Hero"
import HowItWorks from "@/components/landing/HowItWorks"
import Navbar from "@/components/landing/Navbar"
import Pricing from "@/components/landing/Pricing"
import Showcase from "@/components/landing/Showcase"
import Stats from "@/components/landing/Stats"

const Index = () => {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fdf6e3] text-[#1f2a1f]">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Showcase />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}

export default Index
