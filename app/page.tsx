import Benefits from "@/components/Benefits";
import Contact from "@/components/Contact";
import Demo from "@/components/Demo";
import FAQ from "@/components/FAQ";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Benefits />
      <Demo />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  );
}
