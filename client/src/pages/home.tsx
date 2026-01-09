import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dices } from "lucide-react";

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

function IsometricDieSVG({
  sides,
  result,
  isRolling,
}: {
  sides: number;
  result: number | null;
  isRolling: boolean;
}) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${
        isRolling ? "animate-die-roll" : ""
      }`}
      style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full max-w-[280px] max-h-[280px] md:max-w-[320px] md:max-h-[320px] lg:max-w-[360px] lg:max-h-[360px]"
        aria-label={result ? `Die showing ${result}` : "Die ready to roll"}
        role="img"
      >
        <defs>
          <linearGradient id="topFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(174, 72%, 50%)" />
            <stop offset="100%" stopColor="hsl(174, 72%, 40%)" />
          </linearGradient>
          <linearGradient id="leftFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(174, 72%, 35%)" />
            <stop offset="100%" stopColor="hsl(174, 72%, 28%)" />
          </linearGradient>
          <linearGradient id="rightFace" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(174, 72%, 45%)" />
            <stop offset="100%" stopColor="hsl(174, 72%, 38%)" />
          </linearGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="4" dy="8" stdDeviation="8" floodOpacity="0.3" />
          </filter>
        </defs>

        <g filter="url(#shadow)">
          <polygon
            points="100,30 170,70 100,110 30,70"
            fill="url(#topFace)"
            stroke="hsl(174, 72%, 55%)"
            strokeWidth="1"
          />
          <polygon
            points="30,70 100,110 100,180 30,140"
            fill="url(#leftFace)"
            stroke="hsl(174, 72%, 45%)"
            strokeWidth="1"
          />
          <polygon
            points="170,70 100,110 100,180 170,140"
            fill="url(#rightFace)"
            stroke="hsl(174, 72%, 50%)"
            strokeWidth="1"
          />
        </g>

        {result !== null && !isRolling && (
          <g className="animate-bounce-in">
            <text
              x="100"
              y="78"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="28"
              fontWeight="bold"
              fontFamily="Roboto, sans-serif"
            >
              {result}
            </text>
            <text
              x="65"
              y="125"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fillOpacity="0.9"
              fontSize="20"
              fontWeight="bold"
              fontFamily="Roboto, sans-serif"
              transform="rotate(-30, 65, 125)"
            >
              {result}
            </text>
            <text
              x="135"
              y="125"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fillOpacity="0.9"
              fontSize="20"
              fontWeight="bold"
              fontFamily="Roboto, sans-serif"
              transform="rotate(30, 135, 125)"
            >
              {result}
            </text>
          </g>
        )}

        <text
          x="100"
          y="195"
          textAnchor="middle"
          fill="hsl(200, 10%, 45%)"
          fontSize="12"
          fontFamily="Roboto, sans-serif"
        >
          D{sides}
        </text>
      </svg>
    </div>
  );
}

function Header({ isScrolled }: { isScrolled: boolean }) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        isScrolled
          ? "bg-sidebar/95 backdrop-blur-md shadow-lg"
          : "bg-sidebar"
      }`}
      role="banner"
    >
      <div className="h-full px-4 md:px-8 lg:px-12 flex items-center">
        <a
          href="/"
          className="flex items-center gap-3 text-sidebar-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar rounded-md"
          aria-label="DiceForge - Home"
          data-testid="link-home"
        >
          <LogoSVG className="w-10 h-10 text-primary" />
          <span className="text-lg md:text-xl font-medium tracking-tight">
            DiceForge
          </span>
        </a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer
      className="bg-sidebar border-t border-sidebar-border py-4 px-4 md:px-8"
      role="contentinfo"
    >
      <p className="text-center text-sidebar-foreground text-xs md:text-sm font-light">
        &copy; Giga Mangosteen Enterprises. All Rights Reserved.
      </p>
    </footer>
  );
}

export default function Home() {
  const [sides, setSides] = useState(6);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const rollDie = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    setResult(null);

    setTimeout(() => {
      const newResult = Math.floor(Math.random() * sides) + 1;
      setResult(newResult);
      setIsRolling(false);
    }, 3000);
  }, [isRolling, sides]);

  const handleSidesChange = (value: number[]) => {
    setSides(value[0]);
    if (!isRolling) {
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isScrolled={isScrolled} />

      <main
        className="flex-1 pt-20 pb-8 px-4 md:px-8 lg:px-12 flex items-center justify-center"
        role="main"
        aria-label="Die Roller"
      >
        <Card className="w-full max-w-md md:max-w-lg lg:max-w-xl p-6 md:p-8 shadow-xl">
          <h1 className="text-2xl md:text-3xl font-medium text-center mb-6 text-foreground">
            Roll the Die
          </h1>

          <div
            className="w-64 h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 mx-auto mb-8"
            aria-live="polite"
            aria-atomic="true"
          >
            <IsometricDieSVG sides={sides} result={result} isRolling={isRolling} />
          </div>

          {result !== null && !isRolling && (
            <p
              className="text-center text-3xl md:text-4xl font-bold text-primary mb-6"
              role="status"
              aria-label={`Result: ${result}`}
              data-testid="text-result"
            >
              You rolled: {result}
            </p>
          )}

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="sides-slider"
                  className="text-sm font-medium text-foreground"
                >
                  Number of Sides
                </label>
                <span
                  className="text-2xl font-bold text-primary"
                  aria-live="polite"
                  data-testid="text-sides-count"
                >
                  {sides}
                </span>
              </div>
              <Slider
                id="sides-slider"
                min={6}
                max={24}
                step={1}
                value={[sides]}
                onValueChange={handleSidesChange}
                disabled={isRolling}
                aria-label="Select number of sides"
                aria-valuemin={6}
                aria-valuemax={24}
                aria-valuenow={sides}
                data-testid="slider-sides"
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>6</span>
                <span>24</span>
              </div>
            </div>

            <Button
              onClick={rollDie}
              disabled={isRolling}
              size="lg"
              className="w-full h-14 text-lg font-medium rounded-full shadow-lg transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label={isRolling ? "Rolling..." : "Roll the die"}
              data-testid="button-roll"
            >
              {isRolling ? (
                <span className="flex items-center gap-2">
                  <Dices className="w-5 h-5 animate-spin" />
                  Rolling...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Dices className="w-5 h-5" />
                  Roll D{sides}
                </span>
              )}
            </Button>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
