"use client";

import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Filter,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Map,
  Search,
} from "lucide-react";

import regionData from "@/app/terminal/refregion.json";
import citymunData from "@/app/terminal/refcitymun.json";
import brgyData from "@/app/terminal/refbrgy.json";

export default function MarketplacePage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination State
  const [gradeFilter, setGradeFilter] = useState("B");
  const [minVolume, setMinVolume] = useState<number | "">("");
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Geographic Filter State (Cascading)
  const [selectedRegCode, setSelectedRegCode] = useState("");
  const [selectedCitymunCode, setSelectedCitymunCode] = useState("");
  const [selectedBrgyCode, setSelectedBrgyCode] = useState("");

  // Modal State
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);

  // --- Location Data Lookups ---
  const availableRegions = (regionData as any).RECORDS;

  const availableMunicipalities = selectedRegCode
    ? (citymunData as any).RECORDS.filter(
        (m: any) => m.regDesc === selectedRegCode,
      )
    : [];

  const availableBarangays = selectedCitymunCode
    ? (brgyData as any).RECORDS.filter(
        (b: any) => b.citymunCode === selectedCitymunCode,
      )
    : [];

  // Fetch and format data
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/batches");
        if (res.ok) {
          const payload = await res.json();
          const rawBatches = payload?.batches || [];

          const formattedBatches = rawBatches.map((b: any) => ({
            id: b.id,
            farmerName: b.farmers?.name || "Unknown Farmer",
            farmerPhone: b.farmers?.phone_number || "+63 000 000 0000",
            volume_kg: b.volume_kg,
            grade: b.grade,
            price_per_kg: b.price_per_kg || 120,
            imageUrl: b.image_url,
            location: b.location || "",
            // MOCK DISTANCE for hackathon prototype
            distanceKm: Math.floor(Math.random() * 48) + 2,
          }));

          setBatches(formattedBatches);
        }
      } catch (err) {
        console.error("Failed to fetch marketplace", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketplaceData();
  }, []);

  // Compute filtered and sorted list
  const filteredAndSortedBatches = useMemo(() => {
    let result = [...batches];

    // 1. Filter by Grade
    if (gradeFilter !== "All") {
      result = result.filter((b) => b.grade === gradeFilter);
    }

    // 2. Filter by Minimum Volume
    if (minVolume !== "") {
      result = result.filter((b) => b.volume_kg >= Number(minVolume));
    }

    // 3. Filter by Geographic Selection (String Matching)
    if (selectedRegCode) {
      const regionName =
        (regionData as any).RECORDS.find(
          (r: any) => r.regCode === selectedRegCode,
        )?.regDesc || "";
      result = result.filter((b) => b.location.includes(regionName));

      if (selectedCitymunCode) {
        const munName =
          (citymunData as any).RECORDS.find(
            (m: any) => m.citymunCode === selectedCitymunCode,
          )?.citymunDesc || "";
        result = result.filter((b) => b.location.includes(munName));

        if (selectedBrgyCode) {
          const brgyName =
            (brgyData as any).RECORDS.find(
              (b: any) => b.brgyCode === selectedBrgyCode,
            )?.brgyDesc || "";
          result = result.filter((b) => b.location.includes(brgyName));
        }
      }
    }

    // 4. Sort by Nearest
    result.sort((a, b) => a.distanceKm - b.distanceKm);

    return result;
  }, [
    batches,
    gradeFilter,
    minVolume,
    selectedRegCode,
    selectedCitymunCode,
    selectedBrgyCode,
  ]);

  // Compute Pagination
  const totalPages = Math.ceil(
    filteredAndSortedBatches.length / ITEMS_PER_PAGE,
  );
  const paginatedBatches = filteredAndSortedBatches.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );

  // Reset to page 0 if filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [
    gradeFilter,
    minVolume,
    selectedRegCode,
    selectedCitymunCode,
    selectedBrgyCode,
  ]);

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Header & Search/Filter Bar */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
            <p className="text-muted-foreground">
              Source graded ube directly from local cooperatives.
            </p>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border flex flex-col gap-4">
            {/* Row 1: Geographic Filters */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Target Sourcing Location
              </label>
              <div className="grid sm:grid-cols-3 gap-4">
                <select
                  value={selectedRegCode}
                  onChange={(e) => {
                    setSelectedRegCode(e.target.value);
                    setSelectedCitymunCode("");
                    setSelectedBrgyCode("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                >
                  <option value="">Any Region</option>
                  {availableRegions.map((reg: any) => (
                    <option key={reg.regCode} value={reg.regCode}>
                      {reg.regDesc}
                    </option>
                  ))}
                </select>

                <select
                  disabled={!selectedRegCode}
                  value={selectedCitymunCode}
                  onChange={(e) => {
                    setSelectedCitymunCode(e.target.value);
                    setSelectedBrgyCode("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  <option value="">Any Municipality</option>
                  {availableMunicipalities.map((muni: any) => (
                    <option key={muni.citymunCode} value={muni.citymunCode}>
                      {muni.citymunDesc}
                    </option>
                  ))}
                </select>

                <select
                  disabled={!selectedCitymunCode}
                  value={selectedBrgyCode}
                  onChange={(e) => setSelectedBrgyCode(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  <option value="">Any Barangay</option>
                  {availableBarangays.map((brgy: any) => (
                    <option key={brgy.brgyCode} value={brgy.brgyCode}>
                      {brgy.brgyDesc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Specs Filters */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-border">
              <div className="w-full sm:w-48">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Target Grade
                </label>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm cursor-pointer"
                >
                  <option value="All">All Grades</option>
                  <option value="A">Grade A (Seed)</option>
                  <option value="B">Grade B (Industrial)</option>
                  <option value="C">Grade C (Substandard)</option>
                </select>
              </div>

              <div className="w-full sm:w-48">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Min Volume (kg)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={minVolume}
                  onChange={(e) =>
                    setMinVolume(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing top{" "}
            <span className="font-bold text-foreground">
              {paginatedBatches.length}
            </span>{" "}
            nearest results
            {gradeFilter !== "All" ? ` for Grade ${gradeFilter}` : ""}
          </p>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">
            Loading marketplace data...
          </div>
        ) : paginatedBatches.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            No batches found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBatches.map((batch) => {
              const gradeStyle = formatGrade(batch.grade);
              return (
                <Card
                  key={batch.id}
                  className="overflow-hidden border-border bg-card hover:border-mauve-500/50 transition-colors flex flex-col"
                >
                  {/* Image Header */}
                  <div className="relative h-48 bg-muted flex items-center justify-center border-b border-border">
                    {batch.imageUrl ? (
                      <img
                        src={batch.imageUrl}
                        alt="Ube Batch"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge
                        variant="outline"
                        className={`${gradeStyle.color} bg-background/90 backdrop-blur-sm shadow-sm`}
                      >
                        {gradeStyle.label} ({batch.grade})
                      </Badge>
                    </div>
                    {/* Simulated distance badge */}
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                      <Map className="h-3 w-3" /> {batch.distanceKm} km away
                    </div>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">
                          {batch.volume_kg} kg Batch
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {batch.farmerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-violet-600">
                          ₱{batch.price_per_kg}
                        </p>
                        <p className="text-xs text-muted-foreground">per kg</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-muted-foreground mt-auto pb-4">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{batch.location}</span>
                    </div>

                    <Button
                      className="w-full bg-mauve-600 hover:bg-mauve-700 text-white mt-2"
                      onClick={() => setSelectedBatch(batch)}
                    >
                      Acquire Batch
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-6">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Buy Modal Popup */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-2">Contact Farmer</h2>
            <p className="text-muted-foreground text-sm mb-6">
              You are acquiring a{" "}
              <span className="font-bold text-foreground">
                {selectedBatch.volume_kg}kg
              </span>{" "}
              batch of Grade {selectedBatch.grade} ube from{" "}
              <span className="font-bold text-foreground">
                {selectedBatch.farmerName}
              </span>
              .
            </p>

            <div className="bg-muted p-4 rounded-lg flex items-center justify-center gap-3 mb-6 border border-border">
              <Phone className="h-5 w-5 text-violet-500" />
              <span className="text-xl font-mono tracking-wider font-bold text-foreground">
                {selectedBatch.farmerPhone}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedBatch(null)}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() =>
                  (window.location.href = `tel:${selectedBatch.farmerPhone}`)
                }
              >
                Call Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
