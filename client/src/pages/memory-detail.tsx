import { useState, useEffect, useRef } from "react";
import { Link, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Camera, Upload, X, RotateCcw, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ObjectMemory } from "@shared/schema";
import { Header, Footer } from "@/components/Layout";

async function updateMemory(id: string, objectMemory: string): Promise<ObjectMemory> {
    const response = await fetch(`/api/memories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectMemory }),
    });
    if (!response.ok) throw new Error("Failed to update memory");
    return response.json();
}

async function updateMemoryImage(id: string, userImageBase64: string): Promise<ObjectMemory> {
    const response = await fetch(`/api/memories/${id}/image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userImageBase64 }),
    });
    if (!response.ok) throw new Error("Failed to update image");
    return response.json();
}

async function regenerateMemory(id: string): Promise<ObjectMemory> {
    const response = await fetch(`/api/memories/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to regenerate memory");
    return response.json();
}

type ImageMode = "view" | "replace-select" | "camera" | "preview";

export default function MemoryDetail() {
    const [, params] = useRoute("/memory/:id");
    const memoryId = params?.id;
    const [isScrolled, setIsScrolled] = useState(false);
    const [editedMemory, setEditedMemory] = useState<string>("");
    const [imageMode, setImageMode] = useState<ImageMode>("view");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const queryClient = useQueryClient();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch specific memory
    const { data: memory } = useQuery({
        queryKey: ["memory", memoryId],
        queryFn: async () => {
            const response = await fetch(`/api/memories/${memoryId}`);
            if (!response.ok) throw new Error("Failed to fetch memory");
            return response.json() as Promise<ObjectMemory>;
        },
        enabled: !!memoryId,
        refetchInterval: 2000,
    });

    // Update edited memory when memory data changes
    useEffect(() => {
        if (memory?.objectMemory) {
            setEditedMemory(memory.objectMemory);
        }
    }, [memory?.objectMemory]);

    const updateMutation = useMutation({
        mutationFn: (memoryText: string) => {
            if (!memoryId) throw new Error("No memory ID");
            return updateMemory(memoryId, memoryText);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["memory", memoryId] });
            queryClient.invalidateQueries({ queryKey: ["memories"] });
        },
    });

    const updateImageMutation = useMutation({
        mutationFn: async (imageBase64: string) => {
            if (!memoryId) throw new Error("No memory ID");
            const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
            const updatedMemory = await updateMemoryImage(memoryId, base64Data);
            return updatedMemory;
        },
        onSuccess: async () => {
            setCapturedImage(null);
            setImageMode("view");
            queryClient.invalidateQueries({ queryKey: ["memory", memoryId] });
            queryClient.invalidateQueries({ queryKey: ["memories"] });

            if (memoryId) {
                regenerateMemory(memoryId)
                    .then(() => {
                        queryClient.invalidateQueries({ queryKey: ["memory", memoryId] });
                        queryClient.invalidateQueries({ queryKey: ["memories"] });
                    })
                    .catch((error) => {
                        console.error("Regeneration failed:", error);
                    });
            }
        },
        onError: (error) => {
            console.error("Update image error:", error);
            alert("Failed to update image. Please try again.");
        },
    });

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setStream(mediaStream);
            setImageMode("camera");
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Could not access camera. Please check permissions.");
        }
    };

    useEffect(() => {
        if (stream && videoRef.current && imageMode === "camera") {
            videoRef.current.srcObject = stream;
        }
    }, [stream, imageMode]);

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

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
                setImageMode("preview");
            }
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target?.result as string;
                setCapturedImage(imageData);
                setImageMode("preview");
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCancelReplace = () => {
        stopCamera();
        setCapturedImage(null);
        setImageMode("view");
    };

    const handleConfirmReplace = () => {
        if (capturedImage) {
            updateImageMutation.mutate(capturedImage);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setImageMode("replace-select");
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const hasMemoryChanged = editedMemory !== (memory?.objectMemory || "");

    const handleMemoryChange = (value: string) => {
        setEditedMemory(value);
    };

    const handleCancel = () => {
        setEditedMemory(memory?.objectMemory || "");
    };

    const handleSave = () => {
        updateMutation.mutate(editedMemory);
    };

    const getDisplayImage = () => {
        if (memory?.userImageBase64) {
            return `data:image/jpeg;base64,${memory.userImageBase64}`;
        }
        if (memory?.objectImageBase64) {
            return `data:image/png;base64,${memory.objectImageBase64}`;
        }
        return null;
    };

    if (!memory) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
                <Header isScrolled={isScrolled} />
                <main className="flex-1 container mx-auto px-4 py-8 sm:px-8 flex items-center justify-center">
                    <div className="text-center">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                        <p className="text-muted-foreground">Loading memory...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted">
            <Header isScrolled={isScrolled} />

            <main className="flex-1 container mx-auto px-4 py-8 sm:px-8">
                <Link href="/memories">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Memories
                    </Button>
                </Link>

                <div className="mx-auto max-w-3xl space-y-8">
                    <Card className="p-8">
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold mb-2">Memory Details</h2>
                                <p className="text-muted-foreground text-sm">
                                    Created: {new Date(memory.createdAt).toLocaleString()}
                                </p>
                            </div>

                            {/* Image Display / Replace Section */}
                            <div className="space-y-4">
                                {imageMode === "view" && (
                                    <div className="flex flex-col items-center space-y-4">
                                        {getDisplayImage() ? (
                                            <img
                                                src={getDisplayImage()!}
                                                alt={memory.objectDescription || "Object"}
                                                className="max-w-full max-h-64 object-contain rounded-lg border-2 border-border"
                                            />
                                        ) : (
                                            <div className="w-64 h-64 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
                                                <div className="text-center space-y-2">
                                                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
                                                    <p className="text-sm text-muted-foreground">Generating...</p>
                                                </div>
                                            </div>
                                        )}
                                        <Button onClick={() => setImageMode("replace-select")} variant="outline" size="sm">
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Replace Image
                                        </Button>
                                    </div>
                                )}

                                {imageMode === "replace-select" && (
                                    <div className="space-y-4">
                                        <p className="text-center text-sm text-muted-foreground">
                                            Choose how to capture a new image
                                        </p>
                                        <Button onClick={startCamera} className="w-full h-16" size="lg">
                                            <Camera className="mr-2 h-5 w-5" />
                                            Use Camera
                                        </Button>
                                        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full h-16" size="lg">
                                            <Upload className="mr-2 h-5 w-5" />
                                            Upload Photo
                                        </Button>
                                        <Button onClick={handleCancelReplace} variant="ghost" className="w-full">
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                    </div>
                                )}

                                {imageMode === "camera" && (
                                    <div className="space-y-4">
                                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleCancelReplace} variant="outline" className="flex-1">
                                                <X className="mr-2 h-4 w-4" />
                                                Cancel
                                            </Button>
                                            <Button onClick={capturePhoto} className="flex-1">
                                                <Camera className="mr-2 h-4 w-4" />
                                                Capture
                                            </Button>
                                        </div>
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                )}

                                {imageMode === "preview" && capturedImage && (
                                    <div className="space-y-4">
                                        <div className="flex justify-center">
                                            <img src={capturedImage} alt="New image preview" className="max-w-full max-h-64 object-contain rounded-lg border-2 border-border" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleRetake} variant="outline" className="flex-1">
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Retake
                                            </Button>
                                            <Button onClick={handleCancelReplace} variant="outline" className="flex-1">
                                                <X className="mr-2 h-4 w-4" />
                                                Cancel
                                            </Button>
                                            <Button onClick={handleConfirmReplace} disabled={updateImageMutation.isPending} className="flex-1">
                                                {updateImageMutation.isPending ? (
                                                    <>
                                                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    "Confirm"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {imageMode === "view" && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description</label>
                                        <Textarea
                                            value={memory.objectDescription || ""}
                                            placeholder="Image description will appear here after generation..."
                                            className="min-h-[60px] resize-none bg-muted/50"
                                            disabled
                                            readOnly
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Memory</label>
                                        <Textarea
                                            value={editedMemory || ""}
                                            onChange={(e) => handleMemoryChange(e.target.value)}
                                            placeholder="A memory will appear here after generation..."
                                            className="min-h-[120px] resize-none"
                                            disabled={!memory.objectMemory}
                                        />

                                        {memory.objectMemory && (
                                            <div className="flex gap-2">
                                                <Button onClick={handleCancel} disabled={!hasMemoryChanged || updateMutation.isPending} variant="outline" className="flex-1">
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleSave} disabled={!hasMemoryChanged || updateMutation.isPending} className="flex-1">
                                                    {updateMutation.isPending ? (
                                                        <>
                                                            <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        "Save"
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
}
