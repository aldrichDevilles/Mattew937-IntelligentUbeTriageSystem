"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, UploadCloud, CheckCircle2, Server } from "lucide-react";

export default function TerminalPage() {
  const [farmers, setFarmers] = useState<{ id: string; name: string }[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [volume, setVolume] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch farmers on mount
  useEffect(() => {
    async function loadFarmers() {
      try {
        const res = await fetch("/api/farmers");
        if (res.ok) {
          const data = await res.json();

          // Defensive check for the API response shape
          const safeArray = Array.isArray(data) ? data : data?.farmers || [];
          setFarmers(safeArray);
        }
      } catch (err) {
        console.error("Failed to load farmers", err);
        setFarmers([]); // Fallback on error
      }
    }
    loadFarmers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 3); // Max 3 photos
      setFiles(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("farmer_id", selectedFarmer);
    formData.append("volume_kg", volume);
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("/api/grade", { method: "POST", body: formData });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Network error connecting to the vision model.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Grading Terminal</CardTitle>
            <CardDescription>
              Upload cross-sections for immediate edge inference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Farmer Profile</label>
                  <select
                    required
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={selectedFarmer}
                    onChange={(e) => setSelectedFarmer(e.target.value)}
                  >
                    <option value="" disabled>
                      Select Farmer...
                    </option>
                    {farmers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Batch Volume (kg)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="e.g. 50"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Cross-Section Captures (Max 3)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30">
                  <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-violet-600 file:text-white hover:file:bg-violet-700"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {files.length} of 3 photos selected
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                disabled={isLoading || files.length === 0}
              >
                {isLoading
                  ? "Running Triage Inference..."
                  : "Submit for Grading"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Dynamic Result States */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {result?.cv?.needsResample && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              Photos disagree, please rescan the batch.
            </p>
          </div>
        )}

        {result && !result.cv?.needsResample && (
          <Card className="border-border bg-muted/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" /> Triage
                  Complete
                </CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Server className="h-3 w-3" /> {result.cv?.source || "Mock"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Batch Grade
                  </p>
                  <p className="text-3xl font-black text-violet-600">
                    {result.grade}
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Pigment Score
                  </p>
                  <p className="text-3xl font-black">{result.pigmentScore}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {result.cards?.map((card: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-background rounded-lg border border-border p-3"
                  >
                    <div className="aspect-square bg-muted rounded mb-2 overflow-hidden flex items-center justify-center">
                      {/* Drop the image blob/URL here */}
                      <span className="text-xs text-muted-foreground">
                        Photo {idx + 1}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-center">
                      Score: {card.score}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-semibold">
                  SMS Receipt Generated
                </p>
                <p className="text-sm font-mono text-green-400">
                  {result.smsText}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
