import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

export default function Remember() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-md shadow-sm"
            : "bg-background/0"
        }`}
      >
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <LogoSVG className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold leading-none">Remember</h1>
              <p className="text-xs text-muted-foreground">
                Powered by Gemini 3
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-4">Remember</h2>
          <p className="text-muted-foreground">
            Coming soon...
          </p>
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2026 Giga Mangosteen Enterprises
            </p>
            <p className="text-sm text-muted-foreground">
              Powered by Google Gemini 3
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
