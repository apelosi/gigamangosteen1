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
  // Helper to get unique neighboring numbers for the other visible faces
  const getOtherFaces = (res: number) => {
    const face2 = (res % sides) + 1;
    let face3 = ((res + 1) % sides) + 1;
    if (face3 === face2) face3 = (face3 % sides) + 1;
    if (face3 === res) face3 = (face3 % sides) + 1;
    return [face2, face3];
  };

  const otherFaces = result ? getOtherFaces(result) : [null, null];

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${isRolling ? "animate-die-roll" : ""
        }`}
      style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full max-w-[300px] max-h-[300px]"
        aria-label={result ? `Die showing ${result}` : "Die ready to roll"}
        role="img"
      >
        <defs>
          {/* Main Material Gradients */}
          <linearGradient id="topFaceG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8f8f8" />
          </linearGradient>
          <linearGradient id="leftFaceG" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#e0e0e0" />
          </linearGradient>
          <linearGradient id="rightFaceG" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8e8e8" />
            <stop offset="100%" stopColor="#d8d8d8" />
          </linearGradient>

          {/* Deep Engraving Filter for Numbers */}
          <filter id="deepEngrave" x="-20%" y="-20%" width="140%" height="140%">
            <feOffset dx="-0.5" dy="-0.5" in="SourceAlpha" result="offset" />
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset" result="inverse" />
            <feFlood floodColor="black" floodOpacity="1" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />

            <feOffset dx="0.5" dy="0.5" in="SourceAlpha" result="lightOffset" />
            <feGaussianBlur stdDeviation="0.2" result="lightBlur" />
            <feComposite operator="out" in="SourceGraphic" in2="lightOffset" result="lightInverse" />
            <feFlood floodColor="white" floodOpacity="0.4" result="lightColor" />
            <feComposite operator="in" in="lightColor" in2="lightInverse" result="highlight" />

            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="shadow" />
              <feMergeNode in="highlight" />
            </feMerge>
          </filter>

          {/* Soft Ground Shadow */}
          <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Global Ground Shadow */}
        <ellipse cx="100" cy="180" rx="70" ry="18" fill="url(#groundShadow)" />

        {/* The Rounded Die Geometry */}
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* Rounded Isometric Cube Paths */}
          {/* Using elliptical arcs for true filleted corners */}

          {/* LEFT FACE */}
          <path
            d="M32,78 Q30,80 30,85 L30,140 Q30,145 35,147 L95,178 Q100,180 100,175 L100,115 L32,78"
            fill="url(#leftFaceG)"
            stroke="#d0d0d0"
            strokeWidth="1"
          />

          {/* RIGHT FACE */}
          <path
            d="M168,78 Q170,80 170,85 L170,140 Q170,145 165,147 L105,178 Q100,180 100,175 L100,115 L168,78"
            fill="url(#rightFaceG)"
            stroke="#c0c0c0"
            strokeWidth="1"
          />

          {/* TOP FACE */}
          <path
            d="M100,45 Q105,43 110,46 L165,77 Q170,80 165,83 L105,114 Q100,117 95,114 L35,83 Q30,80 35,77 L90,46 Q95,43 100,45"
            fill="url(#topFaceG)"
            stroke="#e0e0e0"
            strokeWidth="1"
          />

          {/* Specular Highlights on edges */}
          <path d="M38,77 L95,46" stroke="white" strokeWidth="2.5" strokeOpacity="0.8" />
          <path d="M105,46 L162,77" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
          <path d="M100,115 L165,80" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
        </g>

        {result !== null && !isRolling && (
          <g filter="url(#deepEngrave)">
            {/* Top Face Number - Calculated center (100, 80) */}
            <text
              x="100"
              y="80"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#080808"
              fontSize="36"
              fontWeight="400"
              fontFamily="'Playfair Display', serif"
              transform="translate(100, 80) scale(1, 0.5) rotate(-45) translate(-100, -80) translate(0, 5)"
            >
              {result}
            </text>

            {/* Left Face Number - Calculated center (65, 130) */}
            <text
              x="65"
              y="130"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#101010"
              fontSize="30"
              fontWeight="400"
              fontFamily="'Playfair Display', serif"
              transform="translate(65, 130) skewY(26) translate(-65, -130)"
            >
              {otherFaces[0]}
            </text>

            {/* Right Face Number - Calculated center (135, 130) */}
            <text
              x="135"
              y="130"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#101010"
              fontSize="30"
              fontWeight="400"
              fontFamily="'Playfair Display', serif"
              transform="translate(135, 130) skewY(-26) translate(-135, -130)"
            >
              {otherFaces[1]}
            </text>
          </g>
        )}

        <text
          x="100"
          y="195"
          textAnchor="middle"
          fill="rgba(0,0,0,0.2)"
          fontSize="11"
          fontWeight="700"
          fontFamily="'Outfit', sans-serif"
          letterSpacing="0.2em"
        >
          D{sides} PREMIUM
        </text>
      </svg>
    </div>
  );
}

function Header({ isScrolled }: { isScrolled: boolean }) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${isScrolled
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
