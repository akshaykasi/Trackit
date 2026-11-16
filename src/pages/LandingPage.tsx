import { CtaBand } from "../components/landing/CtaBand";
import { DashboardPreview } from "../components/landing/DashboardPreview";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { GlassNav } from "../components/landing/GlassNav";
import { Hero } from "../components/landing/Hero";
import { PrepTracksSection } from "../components/landing/PrepTracksSection";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cream px-6 pb-16 pt-6 text-ink">
      <GlassNav />
      <main>
        <Hero />
        <DashboardPreview />
        <FeaturesSection />
        <PrepTracksSection />
        <CtaBand />
      </main>
    </div>
  );
}
