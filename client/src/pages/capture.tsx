import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Memory } from "@shared/schema";

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

// Get or create a browser session ID that persists across page loads
function getBrowserSessionId(): string {
  let sessionId = sessionStorage.getItem("kitchenMemoriesSessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("kitchenMemoriesSessionId", sessionId);
  }
  return sessionId;
}

async function createMemoryRecord(): Promise<Memory> {
  const response = await fetch("/api/memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: getBrowserSessionId() }),
  });
  if (!response.ok) throw new Error("Failed to create memory");
  return response.json();
}

async function generateMemory(id: string): Promise<Memory> {
  const response = await fetch(`/api/memories/${id}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to generate memory");
  return response.json();
}

async function updateMemory(id: string, memory: string): Promise<Memory> {
  const response = await fetch(`/api/memories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memory }),
  });
  if (!response.ok) throw new Error("Failed to update memory");
  return response.json();
}

export default function Capture() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedMemory, setEditedMemory] = useState<string>("");

  const queryClient = useQueryClient();

  // Fetch all memories
  const { data: allMemories = [] } = useQuery({
    queryKey: ["memories"],
    queryFn: async () => {
      const response = await fetch("/api/memories");
      if (!response.ok) throw new Error("Failed to fetch memories");
      return response.json() as Promise<Memory[]>;
    },
    refetchInterval: 2000, // Refetch every 2 seconds to catch new generations
  });

  // Get selected memory data
  const selectedMemory = selectedId
    ? allMemories.find((m) => m.id === selectedId)
    : allMemories[0]; // Default to most recent

  // Update edited memory when selected memory changes
  useEffect(() => {
    if (selectedMemory?.memory) {
      setEditedMemory(selectedMemory.memory);
    }
  }, [selectedMemory?.memory]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Create new memory record
      const newMemory = await createMemoryRecord();
      // Generate memory content for it using the id
      const memory = await generateMemory(newMemory.id);
      // Set it as selected
      setSelectedId(newMemory.id);
      return memory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (memory: string) => {
      if (!selectedId) throw new Error("No memory ID");
      return updateMemory(selectedId, memory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });

  // Check if memory has been changed
  const hasMemoryChanged = editedMemory !== (selectedMemory?.memory || "");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  const handleMemoryChange = (value: string) => {
    setEditedMemory(value);
  };

  const handleCancel = () => {
    setEditedMemory(selectedMemory?.memory || "");
  };

  const handleSave = () => {
    updateMutation.mutate(editedMemory);
  };

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
              <h1 className="text-lg font-bold leading-none">Capture</h1>
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
        <div className="mx-auto max-w-3xl space-y-8">
          <Card className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Kitchen Memories</h2>
                <p className="text-muted-foreground">
                  Generate nostalgic memories about random kitchen objects with AI-generated images
                </p>
              </div>

              {/* Generate Button at the top */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-14 text-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    Generating Memory...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Memory
                  </>
                )}
              </Button>

              {isGenerating && (
                <p className="text-sm text-center text-muted-foreground animate-pulse">
                  This may take 20-30 seconds while Gemini 3 creates your memory...
                </p>
              )}

              {/* Image Display */}
              {selectedMemory && (
                <div className="flex justify-center">
                  {selectedMemory.imageBase64 ? (
                    <div className="space-y-2">
                      <img
                        src={`data:image/png;base64,${selectedMemory.imageBase64}`}
                        alt={selectedMemory.imageDescription || "Kitchen object"}
                        className="w-64 h-64 object-contain rounded-lg border-2 border-border"
                      />
                      {selectedMemory.imageDescription && (
                        <p className="text-sm text-center text-muted-foreground">
                          {selectedMemory.imageDescription}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="w-64 h-64 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
                      <div className="text-center space-y-2">
                        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Generating...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description Text Area (Non-editable) */}
              {selectedMemory && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={selectedMemory.imageDescription || ""}
                    placeholder="Image description will appear here after generation..."
                    className="min-h-[60px] resize-none bg-muted/50"
                    disabled
                    readOnly
                  />
                </div>
              )}

              {/* Memory Text Area (Editable) */}
              {selectedMemory && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Memory</label>
                  <Textarea
                    value={editedMemory || ""}
                    onChange={(e) => handleMemoryChange(e.target.value)}
                    placeholder="A memory will appear here after generation..."
                    className="min-h-[120px] resize-none"
                    disabled={!selectedMemory.memory}
                  />

                  {/* Save and Cancel Buttons */}
                  {selectedMemory.memory && (
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
                        onClick={handleSave}
                        disabled={!hasMemoryChanged || updateMutation.isPending}
                        className="flex-1"
                      >
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
              )}
            </div>
          </Card>

          {/* Memory History Table */}
          {allMemories.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
                Memory History
              </p>
              <Card className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Image</th>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Description</th>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Memory</th>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Created</th>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allMemories.map((memory) => (
                        <tr
                          key={memory.id}
                          className={`border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
                            selectedId === memory.id ? "bg-muted" : ""
                          }`}
                          onClick={() => setSelectedId(memory.id)}
                        >
                          <td className="py-2 px-3">
                            {memory.imageBase64 ? (
                              <img
                                src={`data:image/png;base64,${memory.imageBase64}`}
                                alt={memory.imageDescription || "Kitchen object"}
                                className="w-16 h-16 object-contain"
                              />
                            ) : (
                              <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
                                <Sparkles className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-xs max-w-xs">
                            {memory.imageDescription || <span className="text-muted-foreground italic">Generating...</span>}
                          </td>
                          <td className="py-2 px-3 text-xs max-w-md truncate">
                            {memory.memory || <span className="text-muted-foreground italic">Generating...</span>}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs whitespace-nowrap">
                            {new Date(memory.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 px-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(memory.id);
                              }}
                            >
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
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
