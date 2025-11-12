import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";

export function LandingCTA() {
	return (
		<section className="py-20 px-6 bg-stone-900 text-white">
			<div className="max-w-4xl mx-auto text-center">
				<h2 className="text-5xl md:text-7xl uppercase tracking-tight mb-6">
					READY TO LEVEL UP
					<br />
					<span className="italic text-lime-400">YOUR COACHING BUSINESS?</span>
				</h2>

				<p className="text-stone-300 text-lg mb-12 max-w-2xl mx-auto">
					Join hundreds of coaches who are converting more followers into paying clients with SocialTrainer.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
					<Button asChild className="bg-white hover:bg-stone-100 text-stone-900 rounded-full px-8 h-12">
						<a href="/auth/signin">
							Start Your Free Trial <ArrowRight className="w-4 h-4 ml-2" />
						</a>
					</Button>
					<Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-stone-900 rounded-full px-8 h-12">
						Schedule a Demo
					</Button>
				</div>

				<p className="text-stone-500 text-sm">14-day free trial • No credit card required • Cancel anytime</p>
			</div>
		</section>
	);
}


