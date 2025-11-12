import { Dumbbell, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";

export function LandingFooter() {
	const footerLinks = {
		Product: ["Features", "Pricing", "Testimonials", "FAQ", "Roadmap"],
		Resources: ["Blog", "Help Center", "Video Tutorials", "Case Studies", "API Docs"],
		Company: ["About", "Careers", "Contact", "Partners", "Press Kit"],
		Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"],
	};

	return (
		<footer className="py-12 px-6 bg-stone-900 border-t border-stone-800">
			<div className="max-w-7xl mx-auto">
				<div className="grid md:grid-cols-5 gap-12 mb-12">
					<div>
						<div className="flex items-center gap-2 mb-4">
							<div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
								<Dumbbell className="w-4 h-4 text-stone-900" />
							</div>
							<span className="text-white tracking-tight uppercase">SocialTrainer</span>
						</div>
						<p className="text-stone-400 text-sm mb-6">The link-in-bio platform built for fitness coaches.</p>
						<div className="flex gap-4">
							<a href="#" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors">
								<Instagram className="w-4 h-4 text-white" />
							</a>
							<a href="#" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors">
								<Twitter className="w-4 h-4 text-white" />
							</a>
							<a href="#" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors">
								<Youtube className="w-4 h-4 text-white" />
							</a>
							<a href="#" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors">
								<Linkedin className="w-4 h-4 text-white" />
							</a>
						</div>
					</div>

					{Object.entries(footerLinks).map(([category, links]) => (
						<div key={category}>
							<h3 className="text-white uppercase tracking-wide text-sm mb-4">{category}</h3>
							<ul className="space-y-2">
								{links.map((link) => (
									<li key={link}>
										<a href="#" className="text-stone-400 hover:text-white text-sm transition-colors">
											{link}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-stone-500 text-xs">© {new Date().getFullYear()} SocialTrainer. All rights reserved.</p>
					<p className="text-stone-600 text-xs">Made with ❤️ for fitness coaches everywhere</p>
				</div>
			</div>
		</footer>
	);
}


