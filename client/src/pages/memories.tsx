import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ObjectMemory } from "@shared/schema";
import { Header, Footer } from "@/components/Layout";

export default function Memories() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch all memories
  const { data: allMemories = [] } = useQuery({
    queryKey: ["memories"],
    queryFn: async () => {
      const response = await fetch("/api/memories");
      if (!response.ok) throw new Error("Failed to fetch memories");
      return response.json() as Promise<ObjectMemory[]>;
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

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

        <div className="mx-auto max-w-6xl space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Memory Collection</h2>
            <p className="text-muted-foreground">
              Browse all your generated kitchen memories
            </p>
          </div>

          <Card className="p-4">
            {allMemories.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No memories yet. Visit the Capture page to create your first one.
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
                            >
                              OPEN
                            </Button>
                          </Link>
                        </td>
                        <td className="py-2 px-3">
                          {memory.objectImageBase64 ? (
                            <img
                              src={`data:image/png;base64,${memory.objectImageBase64}`}
                              alt={memory.objectDescription || "Kitchen object"}
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
                            ? truncateText(memory.objectDescription, 72)
                            : <span className="text-muted-foreground italic">Generating...</span>
                          }
                        </td>
                        <td className="py-2 px-3 max-w-md break-words">
                          {memory.objectMemory
                            ? truncateText(memory.objectMemory, 72)
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
      </main>

      <Footer />
    </div>
  );
}
