import { Link } from "wouter";

function LogoSVG({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
                fill="currentColor"
                fillOpacity="0.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M24 4L24 24M24 24L42 14M24 24L6 14M24 24L24 44"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle cx="24" cy="18" r="3" fill="currentColor" />
            <circle cx="18" cy="28" r="2" fill="currentColor" />
            <circle cx="30" cy="28" r="2" fill="currentColor" />
            <circle cx="24" cy="36" r="2" fill="currentColor" />
        </svg>
    );
}

export function Header({ isScrolled }: { isScrolled: boolean }) {
    return (
        <header
            className={`sticky top-0 z-50 w-full border-b border-white/10 transition-all duration-300 ${isScrolled ? "shadow-xl" : ""
                }`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)' }}
        >
            <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
                <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <LogoSVG className="h-8 w-8 text-primary" />
                    <h1 className="text-lg font-bold leading-none text-white">Everbloom</h1>
                </Link>
            </div>
        </header>
    );
}

export function Footer() {
    return (
        <footer
            className="border-t border-white/10"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)' }}
        >
            <div className="container mx-auto px-4 py-6 sm:px-8">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-sm text-white/70">
                        © 2026 Giga Mangosteen Enterprises
                    </p>
                    <p className="text-sm text-white/70">
                        Powered by Google Gemini 3
                    </p>
                </div>
            </div>
        </footer>
    );
}
