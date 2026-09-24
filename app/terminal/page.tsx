"use client";

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertCircle,
  UploadCloud,
  CheckCircle2,
  MapPin,
  Camera,
  X,
} from "lucide-react";

// Import the local JSON files directly into the client component
import regionData from "./refregion.json";
import citymunData from "./refcitymun.json";
import brgyData from "./refbrgy.json";

export default function TerminalPage() {
  const [farmerName, setFarmerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [volume, setVolume] = useState("");
  const [pricePerKilo, setPricePerKilo] = useState("");

  // State for the exact administrative codes used to link the JSON files
  const [selectedRegCode, setSelectedRegCode] = useState("");
  const [selectedCitymunCode, setSelectedCitymunCode] = useState("");
  const [selectedBrgyCode, setSelectedBrgyCode] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Camera States & Refs ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Regions are always available
  const availableRegions = (regionData as any).RECORDS;

  // 2. Filter municipalities where regDesc matches the selected regCode
  const availableMunicipalities = selectedRegCode
    ? (citymunData as any).RECORDS.filter(
        (m: any) => m.regDesc === selectedRegCode,
      )
    : [];

  // 3. Filter barangays where citymunCode matches the selected citymunCode
  const availableBarangays = selectedCitymunCode
    ? (brgyData as any).RECORDS.filter(
        (b: any) => b.citymunCode === selectedCitymunCode,
      )
    : [];

  // Safely stop the camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  // Turn off camera if user navigates away
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prioritizes rear camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied or unavailable.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && files.length < 3) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        // Convert canvas drawing to a JPEG Blob, then to a File object
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], `scan-${Date.now()}.jpg`, {
                type: "image/jpeg",
              });
              setFiles((prev) => [...prev, newFile]);

              // Auto-close camera if we hit the 3-photo max
              if (files.length === 2) stopCamera();
            }
          },
          "image/jpeg",
          0.9,
        );
      }
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected].slice(0, 3));
    }
  };

  // Helper to shrink massive mobile photos before uploading
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          // Only shrink if the image is actually larger than the max width
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob)
                resolve(new File([blob], file.name, { type: "image/jpeg" }));
            },
            "image/jpeg",
            0.7, // 70% quality JPEG
          );
        };
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Look up the actual names using the selected codes for the database string
    const regionName =
      (regionData as any).RECORDS.find(
        (r: any) => r.regCode === selectedRegCode,
      )?.regDesc || "";
    const munName =
      (citymunData as any).RECORDS.find(
        (m: any) => m.citymunCode === selectedCitymunCode,
      )?.citymunDesc || "";
    const brgyName =
      (brgyData as any).RECORDS.find(
        (b: any) => b.brgyCode === selectedBrgyCode,
      )?.brgyDesc || "";

    // Stitch the location back into the required DB format
    const formattedLocation = `Brgy. ${brgyName}, ${munName}, ${regionName}`;

    const formData = new FormData();
    formData.append("farmerName", farmerName);
    formData.append("phoneNumber", phoneNumber);
    formData.append("volume", volume);
    formData.append("pricePerKilo", pricePerKilo);
    formData.append("location", formattedLocation);
    // Compress all files in parallel before attaching to the payload
    const compressedFiles = await Promise.all(
      files.map((file) => compressImage(file)),
    );
    compressedFiles.forEach((file) => formData.append("photos", file));

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

              {/* Cascading Location Dropdowns */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Farm Origin Location
                </label>
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Region */}
                  <select
                    required
                    value={selectedRegCode}
                    onChange={(e) => {
                      setSelectedRegCode(e.target.value);
                      setSelectedCitymunCode(""); // Clear downstream selections
                      setSelectedBrgyCode("");
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
                  >
                    <option value="" disabled>
                      Select Region...
                    </option>
                    {availableRegions.map((reg: any) => (
                      <option key={reg.regCode} value={reg.regCode}>
                        {reg.regDesc}
                      </option>
                    ))}
                  </select>

                  {/* Municipality / City */}
                  <select
                    required
                    disabled={!selectedRegCode}
                    value={selectedCitymunCode}
                    onChange={(e) => {
                      setSelectedCitymunCode(e.target.value);
                      setSelectedBrgyCode(""); // Clear downstream selection
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Select City/Muni...
                    </option>
                    {availableMunicipalities.map((muni: any) => (
                      <option key={muni.citymunCode} value={muni.citymunCode}>
                        {muni.citymunDesc}
                      </option>
                    ))}
                  </select>

                  {/* Barangay */}
                  <select
                    required
                    disabled={!selectedCitymunCode}
                    value={selectedBrgyCode}
                    onChange={(e) => setSelectedBrgyCode(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Select Barangay...
                    </option>
                    {availableBarangays.map((brgy: any) => (
                      <option key={brgy.brgyCode} value={brgy.brgyCode}>
                        {brgy.brgyDesc}
                      </option>
                    ))}
                  </select>
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

              {/* Image Upload & Camera Capture */}
              <div className="space-y-4">
                <label className="text-sm font-medium">
                  Cross-Section Captures ({files.length}/3)
                </label>

                {/* The Two Options (Hidden if camera is open or max files reached) */}
                {!isCameraOpen && files.length < 3 && (
                  <div className="flex gap-4">
                    {/* Option 1: Standard File Upload */}
                    <div className="relative flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full flex gap-2"
                      >
                        <UploadCloud className="h-4 w-4" /> Upload Image
                      </Button>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>

                    {/* Option 2: Live Camera Scan */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startCamera}
                      className="flex-1 flex gap-2"
                    >
                      <Camera className="h-4 w-4" /> Scan Camera
                    </Button>
                  </div>
                )}

                {/* Live Camera Viewfinder */}
                {isCameraOpen && (
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video sm:aspect-4/3 flex items-center justify-center border border-border">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <Button
                        type="button"
                        onClick={capturePhoto}
                        className="bg-white text-black hover:bg-zinc-200 rounded-full font-bold px-8"
                      >
                        Capture
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={stopCamera}
                        size="icon"
                        className="rounded-full"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Thumbnail Preview Grid */}
                {files.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-lg border border-border overflow-hidden group"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Scan ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                disabled={isLoading || files.length === 0 || isCameraOpen}
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

              <div className="grid sm:grid-cols-3 gap-4">
                {result.cv?.cards?.map((card: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-background rounded-lg border border-border p-3"
                  >
                    <div className="aspect-square bg-muted rounded mb-2 overflow-hidden flex items-center justify-center">
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
                  SMS sent to {phoneNumber}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
