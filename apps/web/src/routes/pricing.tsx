import "../landing.css";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/navbar";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

function PricingPage() {
  return (
    <div className="landing-page min-h-screen overflow-hidden">
      <Navbar />
      <main className="pt-20">
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
