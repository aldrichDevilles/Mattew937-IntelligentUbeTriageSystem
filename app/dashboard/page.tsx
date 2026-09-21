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
import { RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Map the strict grade letters to the business logic words
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

        // 1. Extract the array from the specific 'batches' key Gift used
        const rawBatches = payload?.batches || [];

        // 2. Map the Supabase database columns to the camelCase props your UI expects
        const formattedBatches = rawBatches.map((b: any) => ({
          time: b.created_at, // Maps Supabase timestamp to UI 'time'
          farmerName: b.farmers?.name || "Unknown Farmer", // Flattens the joined table
          volume_kg: b.volume_kg,
          grade: b.grade,
          pigmentScore: b.pigment_score || b.pigmentScore, // Accounts for snake_case or camelCase
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
  // Poll every 5 seconds
  useEffect(() => {
    fetchBatches(); // Initial fetch
    const interval = setInterval(fetchBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">
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
              Live Sync
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Farmer</th>
                    <th className="px-4 py-3 font-medium">Volume</th>
                    <th className="px-4 py-3 font-medium">Pigment Score</th>
                    <th className="px-4 py-3 font-medium">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batches.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
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
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(batch.time).toLocaleDateString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {batch.farmerName}
                          </td>
                          <td className="px-4 py-3">{batch.volume_kg} kg</td>
                          <td className="px-4 py-3 font-mono">{batch.grade}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={gradeStyle.color}
                            >
                              {gradeStyle.label}
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
    </div>
  );
}
