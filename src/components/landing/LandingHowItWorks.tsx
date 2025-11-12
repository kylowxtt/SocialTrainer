import { UserPlus, Palette, Share2 } from "lucide-react";

const steps = [
	{
		number: "01",
		icon: UserPlus,
		title: "Create Your Account",
		description: "Sign up in seconds. No credit card required for your free trial.",
	},
	{
		number: "02",
		icon: Palette,
		title: "Customize Your Page",
		description: "Add your products, services, photos, and brand colors. Make it yours.",
	},
	{
		number: "03",
		icon: Share2,
		title: "Share & Grow",
		description: "Add your link to Instagram, TikTok, YouTube. Start converting followers to clients.",
	},
];

export function LandingHowItWorks() {
	return (
		<section className="py-20 px-6" id="how-it-works">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-16">
					<h2 className="text-5xl md:text-6xl uppercase tracking-tight mb-6">
						Get Started In
						<br />
						<span className="italic">3 Simple Steps</span>
					</h2>
				</div>

				<div className="grid md:grid-cols-3 gap-8">
					{steps.map((step, index) => {
						const Icon = step.icon;
						return (
							<div key={step.number} className="relative">
								{index < steps.length - 1 && (
									<div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-stone-300" />
								)}
								<div className="text-center relative z-10">
									<div className="inline-flex w-24 h-24 rounded-full bg-stone-900 items-center justify-center mb-6 relative">
										<Icon className="w-10 h-10 text-white" />
										<div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-lime-400 flex items-center justify-center text-sm">
											{step.number}
										</div>
									</div>
									<h3 className="text-2xl uppercase tracking-tight mb-3">{step.title}</h3>
									<p className="text-stone-600 text-sm max-w-xs mx-auto">{step.description}</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}


