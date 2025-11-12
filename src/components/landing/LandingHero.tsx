import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";

export function LandingHero() {
	const scrollToPricing = () => {
		document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<section className="py-20 px-6">
			<div className="max-w-7xl mx-auto">
				<div className="grid lg:grid-cols-2 gap-12 items-center">
					<div>
						<div className="inline-block px-4 py-2 bg-lime-400/20 rounded-full mb-6">
							<span className="text-xs uppercase tracking-wider text-stone-900">For Fitness Coaches</span>
						</div>

						<h1 className="text-6xl md:text-8xl uppercase tracking-tighter leading-none mb-6">
							YOUR LINK IN BIO,<br />
							<span className="italic">ELEVATED</span>
						</h1>

						<p className="text-lg text-stone-600 mb-8 max-w-xl leading-relaxed">
							Convert your social media followers into paying clients with a stunning, customizable link-in-bio page. Built specifically for fitness coaches who get clients through Instagram, TikTok, and YouTube.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 mb-12">
							<Button onClick={scrollToPricing} className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-8 h-12">
								Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
							</Button>
							<Button variant="outline" className="border-2 border-stone-900 text-stone-900 rounded-full px-8 h-12">
								View Demo
							</Button>
						</div>

						<div className="space-y-3">
							{["No credit card required", "Setup in 5 minutes", "Cancel anytime"].map((item) => (
								<div key={item} className="flex items-center gap-2">
									<CheckCircle2 className="w-5 h-5 text-lime-500" />
									<span className="text-sm text-stone-600">{item}</span>
								</div>
							))}
						</div>
					</div>

					<div className="relative">
						<div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-stone-900 bg-stone-900">
							<div className="relative aspect-[9/16] max-w-[400px] mx-auto">
								<Image
									src="https://images.unsplash.com/photo-1758599879795-536d5f203de9?auto=format&fit=crop&w=1080&q=80"
									alt="SocialTrainer Demo"
									className="w-full h-full object-cover"
									fill
								/>
							</div>
						</div>

						<div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-stone-200">
							<div className="text-3xl mb-1">500+</div>
							<div className="text-xs text-stone-600 uppercase tracking-wide">Active Coaches</div>
						</div>

						<div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border border-stone-200">
							<div className="text-3xl mb-1">10K+</div>
							<div className="text-xs text-stone-600 uppercase tracking-wide">Conversions/Month</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}


