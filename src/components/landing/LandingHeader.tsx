import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Button } from "~/components/ui/button";

export function LandingHeader() {
	const scrollToSection = (id: string) => {
		const element = document.getElementById(id);
		element?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<header className="sticky top-0 z-50 bg-stone-100/80 backdrop-blur-md border-b border-stone-200">
			<div className="max-w-7xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center">
							<Dumbbell className="w-4 h-4 text-white" />
						</div>
						<span className="tracking-tight uppercase">SocialTrainer</span>
					</Link>

					<nav className="hidden md:flex items-center gap-8">
						<button
							onClick={() => scrollToSection("features")}
							className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
						>
							Features
						</button>
						<button
							onClick={() => scrollToSection("how-it-works")}
							className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
						>
							How It Works
						</button>
						<button
							onClick={() => scrollToSection("pricing")}
							className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
						>
							Pricing
						</button>
					</nav>

					<div className="flex items-center gap-4">
						<Button variant="ghost" className="text-stone-900" asChild>
							<Link href="/auth/signin">Sign In</Link>
						</Button>
						<Button
							onClick={() => scrollToSection("pricing")}
							className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-6"
						>
							Get Started
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}


