"use client";

import { LandingHeader } from "~/components/landing/LandingHeader";
import { LandingHero } from "~/components/landing/LandingHero";
import { LandingFeatures } from "~/components/landing/LandingFeatures";
import { LandingHowItWorks } from "~/components/landing/LandingHowItWorks";
import { LandingPricing } from "~/components/landing/LandingPricing";
import { LandingTestimonials } from "~/components/landing/LandingTestimonials";
import { LandingCTA } from "~/components/landing/LandingCTA";
import { LandingFooter } from "~/components/landing/LandingFooter";

export default function Home() {
	return (
		<div className="min-h-screen bg-stone-100 text-stone-900">
			<LandingHeader />
			<LandingHero />
			<LandingFeatures />
			<LandingHowItWorks />
			<LandingPricing />
			<LandingTestimonials />
			<LandingCTA />
			<LandingFooter />
		</div>
	);
}


