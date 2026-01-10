import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, X, RotateCcw, Sparkles, ArrowLeft, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Header, Footer } from "@/components/Layout";

interface MatchResult {
  found: boolean;
  description: string;
  matchedMemory?: {
    id: string;
    objectDescription: string;
    objectMemory: string;
    userImageBase64?: string;
  };
}

async function findMatchingObject(imageBase64: string): Promise<MatchResult> {
  const response = await fetch("/api/remember/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });
  if (!response.ok) throw new Error("Failed to find matching object");
  return response.json();
}

type RememberMode = "select" | "camera" | "preview" | "searching" | "result";

export default function Remember() {
  const [mode, setMode] = useState<RememberMode>("select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setMode("camera");
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please check permissions.");
    }
  };

  // Handle video stream when it changes
  useEffect(() => {
    if (stream && videoRef.current && mode === "camera") {
      videoRef.current.srcObject = stream;
    }
  }, [stream, mode]);

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert("Camera is not ready yet. Please wait a moment and try again.");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        stopCamera();
        setMode("preview");
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        setMode("preview");
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Search for matching object
  const searchMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const base64Data = imageBase64.split(",")[1];
      return findMatchingObject(base64Data);
    },
    onSuccess: (result) => {
      setMatchResult(result);
      setMode("result");
    },
    onError: (error) => {
      console.error("Search error:", error);
      alert("Failed to search for matching object. Please try again.");
      setMode("preview");
    },
  });

  const handleConfirmSearch = () => {
    if (capturedImage) {
      setMode("searching");
      searchMutation.mutate(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setMatchResult(null);
    setMode("select");
  };

  const handleTryAgain = () => {
    setCapturedImage(null);
    setMatchResult(null);
    setMode("select");
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
      <Header isScrolled={isScrolled} />

      <main className="flex-1 container mx-auto px-4 py-8 sm:px-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <div className="mx-auto max-w-3xl space-y-8">
          <Card className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Remember</h2>
                <p className="text-muted-foreground">
                  Take a photo of an object to recall its memory
                </p>
              </div>

              {/* Mode: Select (Camera or Upload) */}
              {mode === "select" && (
                <div className="space-y-4">
                  <Button
                    onClick={startCamera}
                    className="w-full h-20 text-lg"
                    size="lg"
                  >
                    <Camera className="mr-2 h-6 w-6" />
                    Use Camera
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-20 text-lg"
                    size="lg"
                  >
                    <Upload className="mr-2 h-6 w-6" />
                    Upload Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Mode: Camera */}
              {mode === "camera" && (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        stopCamera();
                        setMode("select");
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      className="flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Capture
                    </Button>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {/* Mode: Preview */}
              {mode === "preview" && capturedImage && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={capturedImage}
                      alt="Captured object"
                      className="max-w-full max-h-96 object-contain rounded-lg border-2 border-border"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRetake}
                      variant="outline"
                      className="flex-1"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Retake
                    </Button>
                    <Button
                      onClick={handleConfirmSearch}
                      className="flex-1"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Find Memory
                    </Button>
                  </div>
                </div>
              )}

              {/* Mode: Searching */}
              {mode === "searching" && (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    {capturedImage && (
                      <img
                        src={capturedImage}
                        alt="Searching object"
                        className="max-w-full max-h-64 object-contain rounded-lg border-2 border-border opacity-50"
                      />
                    )}
                  </div>
                  <div className="text-center space-y-4">
                    <Sparkles className="h-12 w-12 mx-auto text-primary animate-spin" />
                    <p className="text-muted-foreground">
                      Analyzing image and searching for matching memories...
                    </p>
                  </div>
                </div>
              )}

              {/* Mode: Result */}
              {mode === "result" && matchResult && (
                <div className="space-y-6">
                  {/* User's photo */}
                  <div className="flex justify-center">
                    {capturedImage && (
                      <img
                        src={capturedImage}
                        alt="Your object"
                        className="max-w-full max-h-64 object-contain rounded-lg border-2 border-border"
                      />
                    )}
                  </div>

                  {/* Description of the photo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Object Description</label>
                    <Textarea
                      value={matchResult.description}
                      className="min-h-[80px] resize-none bg-muted/50"
                      disabled
                      readOnly
                    />
                  </div>

                  {/* Match result */}
                  {matchResult.found && matchResult.matchedMemory ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-600 dark:text-green-400 font-semibold text-center mb-4">
                          Memory Found!
                        </p>

                        {/* Show the saved object's image if available */}
                        {matchResult.matchedMemory.userImageBase64 && (
                          <div className="flex justify-center mb-4">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-2">Saved Object</p>
                              <img
                                src={`data:image/jpeg;base64,${matchResult.matchedMemory.userImageBase64}`}
                                alt="Saved object"
                                className="max-w-full max-h-48 object-contain rounded-lg border-2 border-border"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Memory</label>
                        <Textarea
                          value={matchResult.matchedMemory.objectMemory}
                          className="min-h-[120px] resize-none bg-muted/50"
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                      <p className="text-amber-600 dark:text-amber-400 font-semibold">
                        No matching object found
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        This object hasn't been saved yet. Try capturing it in the Capture page first.
                      </p>
                    </div>
                  )}

                  {/* Try Again button */}
                  <Button
                    onClick={handleTryAgain}
                    variant="outline"
                    className="w-full"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Try Another Object
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
