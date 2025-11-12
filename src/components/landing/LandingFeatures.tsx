import { Smartphone, ShoppingBag, MessageSquare, BarChart3, Palette, Zap } from "lucide-react";

const features = [
	{
		icon: Smartphone,
		title: "Mobile-First Design",
		description: "Beautiful, responsive pages optimized for mobile viewing. Perfect for social media traffic.",
	},
	{
		icon: ShoppingBag,
		title: "Sell Products & Services",
		description: "Showcase coaching packages, digital products, merchandise, and book consultations.",
	},
	{
		icon: MessageSquare,
		title: "Lead Capture Forms",
		description: "Built-in contact forms to capture leads and convert followers into paying clients.",
	},
	{
		icon: BarChart3,
		title: "Analytics Dashboard",
		description: "Track clicks, conversions, and understand where your traffic comes from.",
	},
	{
		icon: Palette,
		title: "Fully Customizable",
		description: "Match your brand with custom colors, fonts, images, and layouts.",
	},
	{
		icon: Zap,
		title: "Instant Updates",
		description: "Update your page in seconds. No coding required. Changes go live immediately.",
	},
];

export function LandingFeatures() {
	return (
		<section className="py-20 px-6 bg-white" id="features">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-16">
					<h2 className="text-5xl md:text-6xl uppercase tracking-tight mb-6">
						Everything You Need To
						<br />
						<span className="italic">Grow Your Business</span>
					</h2>
					<p className="text-lg text-stone-600 max-w-2xl mx-auto">
						All the tools fitness coaches need to convert social media followers into paying clients.
					</p>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
					{features.map((feature) => {
						const Icon = feature.icon;
						return (
							<div key={feature.title} className="bg-stone-50 rounded-2xl p-8 hover:bg-stone-100 transition-colors">
								<div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center mb-6">
									<Icon className="w-6 h-6 text-white" />
								</div>
								<h3 className="text-xl uppercase tracking-tight mb-3">{feature.title}</h3>
								<p className="text-stone-600 text-sm leading-relaxed">{feature.description}</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}


