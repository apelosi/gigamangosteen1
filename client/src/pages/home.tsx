import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Camera, BookOpen, Brain } from "lucide-react";

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

export default function Home() {
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
              <h1 className="text-lg font-bold leading-none">Kitchen Memories</h1>
              <p className="text-xs text-muted-foreground">
                Powered by Gemini 3
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Welcome</h2>
            <p className="text-lg text-muted-foreground">
              Generate and explore nostalgic kitchen memories with AI
            </p>
          </div>

          <div className="grid gap-6">
            <Link href="/capture">
              <Button
                variant="outline"
                className="w-full h-24 text-xl justify-start px-8 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Camera className="mr-4 h-8 w-8" />
                Capture
              </Button>
            </Link>

            <Link href="/memories">
              <Button
                variant="outline"
                className="w-full h-24 text-xl justify-start px-8 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <BookOpen className="mr-4 h-8 w-8" />
                Memories
              </Button>
            </Link>

            <Link href="/remember">
              <Button
                variant="outline"
                className="w-full h-24 text-xl justify-start px-8 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Brain className="mr-4 h-8 w-8" />
                Remember
              </Button>
            </Link>
          </div>
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
