import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowLeft, Camera, Upload, X, RotateCcw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ObjectMemory } from "@shared/schema";
import { Header, Footer } from "@/components/Layout";

// Get or create a browser session ID that persists across page loads
function getBrowserSessionId(): string {
  let sessionId = sessionStorage.getItem("kitchenMemoriesSessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("kitchenMemoriesSessionId", sessionId);
  }
  return sessionId;
}

async function createMemoryWithImage(imageBase64: string): Promise<ObjectMemory> {
  const response = await fetch("/api/memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: getBrowserSessionId(),
      userImageBase64: imageBase64
    }),
  });
  if (!response.ok) throw new Error("Failed to create memory");
  return response.json();
}

async function generateMemory(id: string): Promise<ObjectMemory> {
  const response = await fetch(`/api/memories/${id}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to generate memory");
  return response.json();
}

async function updateMemory(id: string, objectMemory: string): Promise<ObjectMemory> {
  const response = await fetch(`/api/memories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objectMemory }),
  });
  if (!response.ok) throw new Error("Failed to update memory");
  return response.json();
}

type CaptureMode = "select" | "camera" | "upload" | "preview" | "result";

export default function Capture() {
  const [mode, setMode] = useState<CaptureMode>("select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentMemory, setCurrentMemory] = useState<ObjectMemory | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [editedMemory, setEditedMemory] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch all memories
  const { data: allMemories = [] } = useQuery({
    queryKey: ["memories"],
    queryFn: async () => {
      const response = await fetch("/api/memories");
      if (!response.ok) throw new Error("Failed to fetch memories");
      return response.json() as Promise<ObjectMemory[]>;
    },
    refetchInterval: 2000,
  });

  // Update edited memory when current memory changes
  useEffect(() => {
    if (currentMemory?.objectMemory) {
      setEditedMemory(currentMemory.objectMemory);
    }
  }, [currentMemory?.objectMemory]);

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

      // Check if video has valid dimensions
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
  };

  // Save and generate
  const createMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      // Remove data URL prefix to get just the base64 data
      const base64Data = imageBase64.split(",")[1];
      const newMemory = await createMemoryWithImage(base64Data);
      return newMemory;
    },
    onSuccess: async (memory) => {
      // Invalidate queries to show the new memory in the table
      queryClient.invalidateQueries({ queryKey: ["memories"] });

      // Reset to select mode immediately
      setCapturedImage(null);
      setCurrentMemory(null);
      setEditedMemory("");
      setMode("select");

      // Trigger generation in the background (don't await)
      generateMemory(memory.id)
        .then(() => {
          // Refresh the memories list when generation completes
          queryClient.invalidateQueries({ queryKey: ["memories"] });
        })
        .catch((error) => {
          console.error("Background generation failed:", error);
          alert("Failed to generate memory description. The image was saved but AI generation failed.");
        });
    },
    onError: (error) => {
      console.error("Save error:", error);
      alert("Failed to save image. Please try again.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (memory: string) => {
      if (!currentMemory) throw new Error("No memory");
      return updateMemory(currentMemory.id, memory);
    },
    onSuccess: (updatedMemory) => {
      setCurrentMemory(updatedMemory);
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
    onError: (error) => {
      console.error("Update error:", error);
      alert("Failed to update memory. Please try again.");
    },
  });

  const handleSaveImage = () => {
    if (capturedImage) {
      createMutation.mutate(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setMode("select");
  };

  const handleNewCapture = () => {
    setCapturedImage(null);
    setCurrentMemory(null);
    setEditedMemory("");
    setMode("select");
  };

  const handleMemoryChange = (value: string) => {
    setEditedMemory(value);
  };

  const handleCancel = () => {
    setEditedMemory(currentMemory?.objectMemory || "");
  };

  const handleSaveMemory = () => {
    updateMutation.mutate(editedMemory);
  };

  const hasMemoryChanged = editedMemory !== (currentMemory?.objectMemory || "");

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
                <h2 className="text-3xl font-bold mb-2">Capture Object</h2>
                <p className="text-muted-foreground">
                  Take a photo or upload an image to generate a nostalgic memory
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
                      onClick={handleSaveImage}
                      disabled={createMutation.isPending}
                      className="flex-1"
                    >
                      {createMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Mode: Result */}
              {mode === "result" && currentMemory && (
                <div className="space-y-6">
                  {/* User's uploaded image */}
                  <div className="flex justify-center">
                    {currentMemory.userImageBase64 ? (
                      <img
                        src={`data:image/jpeg;base64,${currentMemory.userImageBase64}`}
                        alt="Your object"
                        className="max-w-full max-h-64 object-contain rounded-lg border-2 border-border"
                      />
                    ) : capturedImage && (
                      <img
                        src={capturedImage}
                        alt="Your object"
                        className="max-w-full max-h-64 object-contain rounded-lg border-2 border-border"
                      />
                    )}
                  </div>

                  {/* AI Generated Image */}
                  {currentMemory.objectImageBase64 && (
                    <div className="flex justify-center">
                      <div className="space-y-2">
                        <p className="text-sm text-center font-medium text-muted-foreground">
                          AI Generated Illustration
                        </p>
                        <img
                          src={`data:image/png;base64,${currentMemory.objectImageBase64}`}
                          alt={currentMemory.objectDescription || "Generated illustration"}
                          className="w-64 h-64 object-contain rounded-lg border-2 border-border"
                        />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={currentMemory.objectDescription || ""}
                      placeholder="Description will appear here..."
                      className="min-h-[60px] resize-none bg-muted/50"
                      disabled
                      readOnly
                    />
                  </div>

                  {/* Memory (Editable) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Memory</label>
                    <Textarea
                      value={editedMemory || ""}
                      onChange={(e) => handleMemoryChange(e.target.value)}
                      placeholder="Memory will appear here..."
                      className="min-h-[120px] resize-none"
                      disabled={!currentMemory.objectMemory}
                    />

                    {currentMemory.objectMemory && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCancel}
                          disabled={!hasMemoryChanged || updateMutation.isPending}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveMemory}
                          disabled={!hasMemoryChanged || updateMutation.isPending}
                          className="flex-1"
                        >
                          {updateMutation.isPending ? (
                            <>
                              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* New Capture Button */}
                  <Button
                    onClick={handleNewCapture}
                    variant="outline"
                    className="w-full"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture New Object
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Memory History Table */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
              Memory History
            </p>
            <Card className="p-4">
              {allMemories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No memories yet. Capture your first object to create a memory.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 px-3"></th>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Image</th>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Description</th>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Memory</th>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allMemories.map((memory) => (
                        <tr
                          key={memory.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-2 px-3">
                            <Link href={`/memory/${memory.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                OPEN
                              </Button>
                            </Link>
                          </td>
                          <td className="py-2 px-3">
                            {memory.userImageBase64 ? (
                              <img
                                src={`data:image/jpeg;base64,${memory.userImageBase64}`}
                                alt="User's object"
                                className="w-16 h-16 object-contain"
                              />
                            ) : memory.objectImageBase64 ? (
                              <img
                                src={`data:image/png;base64,${memory.objectImageBase64}`}
                                alt={memory.objectDescription || "Object"}
                                className="w-16 h-16 object-contain"
                              />
                            ) : (
                              <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
                                <Sparkles className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 max-w-xs break-words">
                            {memory.objectDescription
                              ? (memory.objectDescription.length > 72
                                ? memory.objectDescription.substring(0, 72) + "..."
                                : memory.objectDescription)
                              : <span className="text-muted-foreground italic">Generating...</span>
                            }
                          </td>
                          <td className="py-2 px-3 max-w-md break-words">
                            {memory.objectMemory
                              ? (memory.objectMemory.length > 72
                                ? memory.objectMemory.substring(0, 72) + "..."
                                : memory.objectMemory)
                              : <span className="text-muted-foreground italic">Generating...</span>
                            }
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
                              <span className="text-muted-foreground">{new Date(memory.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
