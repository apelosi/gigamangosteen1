import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Camera, BookOpen, Brain } from "lucide-react";
import { Header, Footer } from "@/components/Layout";

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
      <Header isScrolled={isScrolled} />

      <main className="flex-1 container mx-auto px-4 py-16 sm:px-8">
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

      <Footer />
    </div>
  );
}
