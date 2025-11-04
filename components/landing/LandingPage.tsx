'use client';

import '@/app/landing.css';
import Navbar from './Navbar';
import Hero from './Hero';
import ServicesCarousel from './ServicesCarousel';
import HowItWorks from './HowItWorks';
import WhyTrust from './WhyTrust';
import Testimonials from './Testimonials';
import Stats from './Stats';
import CTASection from './CTASection';
import Chatbot from './Chatbot';
import ExitPopup from './ExitPopup';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <ServicesCarousel />
      <HowItWorks />
      <WhyTrust />
      <Testimonials />
      <Stats />
      <CTASection />
      <Chatbot />
      <ExitPopup />
      <Footer />
    </>
  );
}
