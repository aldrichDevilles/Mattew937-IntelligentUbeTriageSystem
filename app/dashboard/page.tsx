"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MapPin, ImageIcon, X } from "lucide-react";

export default function DashboardPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // New state for modal

  const formatGrade = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case "A":
        return {
          label: "Seed",
          color: "bg-green-500/10 text-green-600 border-green-500/20",
        };
      case "B":
        return {
          label: "Industrial",
          color: "bg-violet-500/10 text-violet-600 border-violet-500/20",
        };
      case "C":
        return {
          label: "Below Standard",
          color: "bg-red-500/10 text-red-600 border-red-500/20",
        };
      default:
        return {
          label: "Pending",
          color: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
        };
    }
  };

  const fetchBatches = async () => {
    setIsPolling(true);
    try {
      const res = await fetch("/api/batches");
      if (res.ok) {
        const payload = await res.json();
        const rawBatches = payload?.batches || [];
        const formattedBatches = rawBatches.map((b: any) => ({
          time: b.created_at,
          farmerName: b.farmers?.name || "Unknown Farmer",
          volume_kg: b.volume_kg,
          grade: b.grade,
          anthocyanin_score: b.anthocyanin_score || b.anthocyanin_score,
          imageUrl: b.image_url,
          location: b.location || "Location unavailable",
        }));
        setBatches(formattedBatches);
      }
    } catch (err) {
      console.error("Failed to fetch ledger", err);
      setBatches([]);
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    const interval = setInterval(fetchBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      <Navbar />
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-8">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-2xl">
                Global Inventory Ledger
              </CardTitle>
              <CardDescription>
                Live feed of farm-gate graded ube batches.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw
                className={`h-4 w-4 ${isPolling ? "animate-spin text-violet-500" : ""}`}
              />
              <span className="hidden sm:inline">Live Sync</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {/* Scrollable container for the table */}
            <div className="w-full overflow-x-auto sm:rounded-md sm:border sm:border-border">
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    {/* Sticky header for the image column */}
                    <th className="px-4 py-3 font-medium sticky left-0 bg-muted/95 z-20 backdrop-blur shadow-[1px_0_0_0_#e5e7eb] dark:shadow-[1px_0_0_0_#27272a]">
                      Scan
                    </th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Farmer</th>
                    <th className="px-4 py-3 font-medium">Volume</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batches.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Waiting for terminal data...
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch, idx) => {
                      const gradeStyle = formatGrade(batch.grade);
                      return (
                        <tr
                          key={idx}
                          className="bg-background hover:bg-muted/20 transition-colors"
                        >
                          {/* Sticky cell for the image */}
                          <td className="px-4 py-3 sticky left-0 bg-background z-10 shadow-[1px_0_0_0_#e5e7eb] dark:shadow-[1px_0_0_0_#27272a]">
                            {batch.imageUrl ? (
                              <img
                                src={batch.imageUrl}
                                alt={`Batch`}
                                onClick={() => setSelectedImage(batch.imageUrl)}
                                className="h-10 w-10 rounded-md object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center border border-border">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {new Date(batch.time).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            {new Date(batch.time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {batch.location}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            {batch.farmerName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {batch.volume_kg} kg
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {batch.anthocyanin_score
                              ? batch.anthocyanin_score.toFixed(1)
                              : "--"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={gradeStyle.color}
                            >
                              {gradeStyle.label} ({batch.grade})
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Image Popup Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl w-full flex justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImage}
              alt="Enlarged scan"
              className="rounded-lg max-h-[80vh] w-auto object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
