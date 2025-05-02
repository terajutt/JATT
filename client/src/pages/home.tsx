import { useState } from "react";
import HeroSection from "@/components/home/hero-section";
import BookingForm from "@/components/home/booking-form";
import RideTracking from "@/components/home/ride-tracking";
import Features from "@/components/home/features";
import CoverageMap from "@/components/home/coverage-map";
import Testimonials from "@/components/home/testimonials";
import CallToAction from "@/components/home/call-to-action";
import DriverSignupModal from "@/components/auth/driver-signup-modal";

export default function Home() {
  const [activeSection, setActiveSection] = useState<"booking" | "tracking">("booking");
  const [isDriverSignupOpen, setIsDriverSignupOpen] = useState(false);

  const scrollToBookingSection = () => {
    setActiveSection("booking");
    setTimeout(() => {
      const bookingSection = document.getElementById("bookingSection");
      if (bookingSection) {
        window.scrollTo({
          top: bookingSection.offsetTop - 100,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const scrollToTrackingSection = () => {
    setActiveSection("tracking");
    setTimeout(() => {
      const trackingSection = document.getElementById("trackingSection");
      if (trackingSection) {
        window.scrollTo({
          top: trackingSection.offsetTop - 100,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  return (
    <>
      <HeroSection 
        onBookNowClick={scrollToBookingSection}
        onTrackRideClick={scrollToTrackingSection}
      />
      
      {activeSection === "booking" ? (
        <BookingForm />
      ) : (
        <RideTracking />
      )}
      
      <Features />
      <CoverageMap />
      <Testimonials />
      <CallToAction 
        onBookNowClick={scrollToBookingSection}
        onDriverSignupClick={() => setIsDriverSignupOpen(true)}
      />

      <DriverSignupModal 
        isOpen={isDriverSignupOpen}
        onClose={() => setIsDriverSignupOpen(false)}
        onShowLogin={() => setIsDriverSignupOpen(false)}
      />
    </>
  );
}
