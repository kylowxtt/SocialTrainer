import { Check, Star } from "lucide-react";
import { Button } from "~/components/ui/button";

const plans = [
	{
		name: "Starter",
		price: "$19",
		period: "/month",
		description: "Perfect for new coaches building their online presence",
		features: ["Custom link-in-bio page", "Up to 10 products/services", "Contact form integration", "Basic analytics", "Mobile optimized", "SSL security"],
		cta: "Start Free Trial",
		popular: false,
	},
	{
		name: "Pro",
		price: "$49",
		period: "/month",
		description: "For established coaches serious about growth",
		features: ["Everything in Starter", "Unlimited products/services", "Advanced analytics", "Custom domain", "Remove SocialTrainer branding", "Priority support", "A/B testing", "Email automation"],
		cta: "Start Free Trial",
		popular: true,
	},
	{
		name: "Agency",
		price: "$149",
		period: "/month",
		description: "For agencies managing multiple coaches",
		features: ["Everything in Pro", "Up to 10 coach accounts", "White label solution", "API access", "Dedicated account manager", "Custom integrations", "Advanced reporting"],
		cta: "Contact Sales",
		popular: false,
	},
];

export function LandingPricing() {
	return (
		<section className="py-20 px-6 bg-white" id="pricing">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-16">
					<h2 className="text-5xl md:text-6xl uppercase tracking-tight mb-6">
						Simple, Transparent
						<br />
						<span className="italic">Pricing</span>
					</h2>
					<p className="text-lg text-stone-600 max-w-2xl mx-auto">Start with a 14-day free trial. No credit card required. Cancel anytime.</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8">
					{plans.map((plan) => (
						<div key={plan.name} className={`rounded-3xl p-8 border-2 ${plan.popular ? "border-stone-900 bg-stone-900 text-white scale-105" : "border-stone-200 bg-white"} relative`}>
							{plan.popular && (
								<div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-400 text-stone-900 px-4 py-1 rounded-full text-xs uppercase tracking-wide flex items-center gap-1">
									<Star className="w-3 h-3 fill-current" />
									Most Popular
								</div>
							)}

							<div className="mb-8">
								<h3 className="text-2xl uppercase tracking-tight mb-2">{plan.name}</h3>
								<p className={`text-sm mb-6 ${plan.popular ? "text-stone-300" : "text-stone-600"}`}>{plan.description}</p>
								<div className="flex items-baseline gap-1">
									<span className="text-5xl">{plan.price}</span>
									<span className={plan.popular ? "text-stone-400" : "text-stone-500"}>{plan.period}</span>
								</div>
							</div>

							<ul className="space-y-3 mb-8">
								{plan.features.map((feature) => (
									<li key={feature} className="flex items-start gap-2">
										<Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? "text-lime-400" : "text-lime-500"}`} />
										<span className={`text-sm ${plan.popular ? "text-stone-200" : "text-stone-600"}`}>{feature}</span>
									</li>
								))}
							</ul>

							<Button className={`w-full rounded-full h-12 ${plan.popular ? "bg-white hover:bg-stone-100 text-stone-900" : "bg-stone-900 hover:bg-stone-800 text-white"}`}>{plan.cta}</Button>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}


