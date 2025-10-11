import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ServiceCategories from "@/components/landing/ServiceCategories";
import ProviderCTA from "@/components/landing/ProviderCTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <HowItWorks />
      <ServiceCategories />
      <ProviderCTA />
      <Footer />
    </main>
  );
}

