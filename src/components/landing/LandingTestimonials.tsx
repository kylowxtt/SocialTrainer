import Image from "next/image";
import { Star } from "lucide-react";

const testimonials = [
	{
		name: "Sarah Mitchell",
		role: "Online Fitness Coach",
		image: "https://images.unsplash.com/photo-1612928414075-bc722ade44f1?auto=format&fit=crop&w=1080&q=80",
		quote:
			"SocialTrainer completely transformed my business. I went from spending hours managing my link-in-bio to having a beautiful, professional page that converts. Revenue is up 40%.",
		stats: "+40% Revenue",
	},
	{
		name: "Marcus Johnson",
		role: "Strength & Conditioning Coach",
		image: "https://images.unsplash.com/photo-1603188155321-376859fb5c37?auto=format&fit=crop&w=1080&q=80",
		quote:
			"As someone who isn't tech-savvy, SocialTrainer made it so easy to create a stunning page. My clients love how professional it looks, and I love how easy it is to update.",
		stats: "5 min Setup",
	},
	{
		name: "Jessica Chen",
		role: "Yoga & Wellness Coach",
		image: "https://images.unsplash.com/photo-1742239614185-b50da3deb7cd?auto=format&fit=crop&w=1080&q=80",
		quote:
			"The analytics alone are worth it. I can finally track which Instagram posts drive the most conversions. This has completely changed my content strategy.",
		stats: "3x Conversion Rate",
	},
];

export function LandingTestimonials() {
	return (
		<section className="py-20 px-6">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-16">
					<h2 className="text-5xl md:text-6xl uppercase tracking-tight mb-6">
						Trusted By
						<br />
						<span className="italic">Top Coaches</span>
					</h2>
				</div>

				<div className="grid md:grid-cols-3 gap-8">
					{testimonials.map((testimonial) => (
						<div key={testimonial.name} className="bg-white rounded-2xl p-8 border-2 border-stone-200">
							<div className="flex gap-1 mb-6">
								{[...Array(5)].map((_, i) => (
									<Star key={i} className="w-5 h-5 fill-lime-400 text-lime-400" />
								))}
							</div>

							<p className="text-stone-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>

							<div className="flex items-center gap-4 pt-6 border-t border-stone-200">
								<div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 relative">
									<Image src={testimonial.image} alt={testimonial.name} className="object-cover" fill />
								</div>
								<div className="flex-1">
									<div className="uppercase tracking-tight text-sm">{testimonial.name}</div>
									<div className="text-xs text-stone-500">{testimonial.role}</div>
								</div>
								<div className="text-right">
									<div className="text-lime-500 text-sm">{testimonial.stats}</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}


