"use client";

import { useState } from "react";
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

const TIER_LABEL: Record<string, string> = {
  seed: "Seed",
  industrial: "Industrial",
  reject: "Below standard",
};

export default function TerminalPage() {
  const [farmerName, setFarmerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [volume, setVolume] = useState("");
  const [pricePerKilo, setPricePerKilo] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [wholeFiles, setWholeFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 3);
      setFiles(selected);
    }
  };

  const handleWholeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setWholeFiles(Array.from(e.target.files).slice(0, 3));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("farmerName", farmerName);
    formData.append("phoneNumber", phoneNumber);
    formData.append("volume", volume);
    formData.append("pricePerKilo", pricePerKilo);
    files.forEach((file) => formData.append("photos", file));
    wholeFiles.forEach((file) => formData.append("whole_photos", file));

    try {
      const res = await fetch("/api/grade", { method: "POST", body: formData });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server Error:", errorText);
        setError(
          `Server Error ${res.status}: Check browser console for details.`,
        );
        setIsLoading(false);
        return;
      }

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(`Network error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const tubers: any[] = result?.cv?.tubers ?? [];
  const sproutTubers: any[] = result?.sprouts?.tubers ?? [];
  const isMock = result?.cv?.source === "mock";
  const smsText: string | undefined = result?.sms?.message ?? result?.smsText;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Grading Terminal</CardTitle>
            <CardDescription>
              Register farmer and upload cross-sections for immediate edge
              inference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Farmer Profile Inputs */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Farmer Name</label>
                  <input
                    type="text"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="e.g. Juan Dela Cruz"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <input
                    type="tel"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="e.g. +639995789711"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Batch Details Inputs */}
              <div className="grid sm:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Price per kilo (PHP)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="e.g. 120.00"
                    value={pricePerKilo}
                    onChange={(e) => setPricePerKilo(e.target.value)}
                  />
                </div>
              </div>

              {/* Cross-section upload */}
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

              {/* Optional whole-tuber upload (experimental sprout check) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Whole-Tuber Photos (optional, max 3)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center bg-muted/20">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleWholeFileChange}
                    className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-700 file:text-white hover:file:bg-zinc-800"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Used for the experimental sprout check only. It does not
                    change the grade. {wholeFiles.length} selected.
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
                  <CheckCircle2 className="text-green-500 h-5 w-5" /> Analysis
                  Complete!
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 ${
                    isMock ? "border-amber-500 text-amber-600" : ""
                  }`}
                >
                  <Server className="h-3 w-3" />
                  {isMock ? "Mock grader (placeholder)" : "Color analysis"}
                  {result.cv?.modelVersion
                    ? ` · ${result.cv.modelVersion}`
                    : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background p-4 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground mb-1">Grade</p>
                  <p className="text-3xl font-black text-violet-600">
                    {result.batch?.grade}
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Pigment Score
                  </p>
                  <p className="text-3xl font-black text-violet-600">
                    {result.cv?.pigmentScore}
                  </p>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Classification
                  </p>
                  <p className="text-3xl font-black text-violet-600">
                    {result.batch?.grade === "A"
                      ? "Seed"
                      : result.batch?.grade === "B"
                        ? "Industrial"
                        : result.batch?.grade === "C"
                          ? "Below Standard"
                          : "Pending"}
                  </p>
                </div>
              </div>

              {/* Reliability of the measurement */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-background p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Pigment spread
                  </p>
                  <p className="text-lg font-bold">
                    {result.cv?.pigmentSpread ?? "-"}
                  </p>
                </div>
                <div className="bg-background p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Tubers analyzed
                  </p>
                  <p className="text-lg font-bold">{tubers.length}</p>
                </div>
              </div>

              {/* Per-tuber breakdown: the reason behind the grade */}
              {tubers.length > 0 && (
                <div className="grid sm:grid-cols-3 gap-4">
                  {tubers.map((t: any, idx: number) => {
                    const url = result.imageUrls?.[idx];
                    return (
                      <div
                        key={idx}
                        className="bg-background rounded-lg border border-border p-3 space-y-2"
                      >
                        <div className="aspect-square bg-muted rounded overflow-hidden flex items-center justify-center">
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt={`Photo ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Photo {idx + 1}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-center">
                          Score {t.pigmentScore} ·{" "}
                          {TIER_LABEL[t.grade] ?? t.grade}
                        </p>
                        <div className="flex flex-wrap justify-center gap-1">
                          {t.defects?.length ? (
                            t.defects.map((d: string) => (
                              <Badge
                                key={d}
                                variant="outline"
                                className="border-red-500/40 text-red-600 text-xs"
                              >
                                {d.replace("_", " ")}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-green-600">
                              No defects detected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Experimental sprout check: display only, never affects grade */}
              {sproutTubers.length > 0 && (
                <div className="bg-background rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Sprout check</p>
                    <Badge variant="outline" className="text-xs">
                      Experimental, not part of the grade
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sproutTubers.map((s: any) => (
                      <Badge key={s.index} variant="secondary">
                        Tuber {s.index + 1}: {s.status}
                        {s.sproutCount ? ` (${s.sproutCount})` : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* SMS the farmer receives */}
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-semibold">
                  SMS Receipt Generated
                </p>
                <p className="text-sm font-mono text-green-400">
                  {smsText ?? "No message returned."}
                </p>
                {result.sms && (
                  <p className="text-xs text-zinc-500 mt-2">
                    {result.sms.mocked
                      ? "Mock mode: not actually sent."
                      : result.sms.delivered
                        ? "Delivered."
                        : "Not delivered."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
