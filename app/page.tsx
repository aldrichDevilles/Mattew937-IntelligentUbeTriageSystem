// app/page.tsx
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ScrollSequence } from "@/components/ScrollSequence";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  BrainCircuit,
  Database,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Sprout,
  LineChart,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <Navbar />

      <main className="flex-1">
        {/* 1. HERO SECTION (The Hook with Scroll Sequence) */}
        <section className="relative h-[300vh]">
          <ScrollSequence />

          <div className="absolute top-0 left-0 w-full h-screen flex flex-col items-center justify-center space-y-6 text-center px-6 z-10">
            <Badge
              variant="secondary"
              className="bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border-violet-500/20 mb-4"
            >
              UbeRated: Intelligent Ube Triage System
            </Badge>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl text-white drop-shadow-lg">
              The New Standard <br></br>for{" "}
              <span className="text-violet-400">Philippine Ube.</span>
            </h1>
            <p className="max-w-2xl text-lg sm:text-xl text-zinc-200 leading-relaxed drop-shadow-md">
              Rapid AI farm-gate phenotyping to preserve planting stock and
              secure fair pricing for cooperatives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Button
                render={<Link href="/terminal" />}
                nativeButton={false}
                size="lg"
                className="bg-violet-600 hover:bg-violet-700 text-white border-none h-12 px-8 text-base"
              >
                Open Grading Terminal
              </Button>

              <Button
                render={<Link href="/dashboard" />}
                nativeButton={false}
                variant="outline"
                size="lg"
                className="bg-zinc-950/40 text-white hover:bg-zinc-900/60 border-zinc-700 backdrop-blur-sm h-12 px-8 text-base"
              >
                View Scanned Inventory
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION WRAPPER FOR CONTENT BELOW HERO */}
        <div className="relative z-20 bg-zinc-50 dark:bg-zinc-950">
          {/* 2. THE CRISIS (Problem-Solution Fit) */}
          <section className="py-24 px-6 max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                The Commodity Trap
              </h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Why the Philippine ube supply chain is losing its most vital
                resource.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <TrendingDown className="w-10 h-10 text-red-500 mb-4" />
                  <CardTitle className="text-xl">The Current Reality</CardTitle>
                  <CardDescription className="text-zinc-600 dark:text-zinc-400 text-base">
                    Farmers sell 50kg sacks of uncalibrated tubers for immediate
                    cash. Traders guess quality by eye, sending high-vitality
                    planting materials to industrial food processors,
                    permanently draining the national seed stock.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-violet-50 dark:bg-violet-950/10 border-violet-200 dark:border-violet-900">
                <CardHeader>
                  <CheckCircle2 className="w-10 h-10 text-violet-600 dark:text-violet-500 mb-4" />
                  <CardTitle className="text-xl">
                    The UbeRated Intervention
                  </CardTitle>
                  <CardDescription className="text-zinc-700 dark:text-zinc-300 text-base">
                    Intercepting harvests directly at the cooperative. We
                    instantly grade cross-sections to route premium propagation
                    seeds to certified nurseries, ensuring zero waste and fair,
                    data-backed payouts to farmers.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* 3. THE TRIAGE PIPELINE (How It Works) */}
          <section className="py-24 px-6 bg-zinc-100 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-center mb-16">
                The Edge Triage Pipeline
              </h2>
              <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting Line (Hidden on Mobile) */}
                <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-zinc-300 dark:bg-zinc-700 z-0" />

                <PipelineStep
                  icon={
                    <Camera className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  }
                  title="1. Standardized Scan"
                  description="Agents capture a cross-section photo inside a low-cost, controlled lightbox directly at the farm gate."
                />
                <PipelineStep
                  icon={
                    <BrainCircuit className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  }
                  title="2. AI Grading"
                  description="The vision model evaluates anthocyanin density and internal rot, outputting a precise commercial grade."
                />
                <PipelineStep
                  icon={
                    <Database className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  }
                  title="3. Instant Ledger"
                  description="Data is pushed to a live inventory feed. Farmers receive immediate Twilio SMS payout receipts."
                />
              </div>
            </div>
          </section>

          {/* 4. THE CORE VIEWS (The Live Demo) */}
          <section className="py-24 px-6 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-16">
              Dual-Sided Value
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="group overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="h-48 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
                  <Sprout className="w-16 h-16 text-zinc-400 group-hover:text-violet-500 transition-colors" />
                </div>
                <CardHeader>
                  <CardTitle>Co-op Grading Terminal</CardTitle>
                  <CardDescription>
                    A frictionless, agent-facing edge capture interface. Upload
                    cross-sections, receive instant AI grading, and automate
                    farmer SMS payouts.
                  </CardDescription>
                  <Button
                    variant="link"
                    render={<Link href="/terminal" />}
                    nativeButton={false}
                    className="p-0 h-auto text-violet-600 dark:text-violet-400 mt-4 justify-start"
                  >
                    Launch Terminal <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  // ... and for the dashboard card:
                  <Button
                    variant="link"
                    render={<Link href="/dashboard" />}
                    nativeButton={false}
                    className="p-0 h-auto text-violet-600 dark:text-violet-400 mt-4 justify-start"
                  >
                    View Ledger <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
              </Card>

              <Card className="group overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 relative">
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-2 py-1">
                    DaaS & B2B Integration Q4
                  </Badge>
                </div>
                <div className="h-48 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
                  <LineChart className="w-16 h-16 text-zinc-400 group-hover:text-violet-500 transition-colors" />
                </div>
                <CardHeader>
                  <CardTitle>Global Inventory Ledger</CardTitle>
                  <CardDescription>
                    A unified, read-only feed of all scanned batches. A
                    foundational view ready to scale into a gated SaaS
                    marketplace for food processors.
                  </CardDescription>
                  <Button
                    variant="link"
                    render={<Link href="/dashboard" />}
                    className="p-0 h-auto text-violet-600 dark:text-violet-400 mt-4 justify-start"
                  >
                    View Ledger <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* 5. VALIDATION & EVIDENCE */}
          <section className="py-20 px-6 bg-violet-600 dark:bg-violet-900 text-white text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-sm font-bold tracking-widest uppercase text-violet-200 mb-4">
                Evidence Beats Claim
              </h2>
              <div className="grid sm:grid-cols-3 gap-8 mt-8">
                <div>
                  <div className="text-5xl font-black mb-2">20</div>
                  <div className="text-violet-200 text-sm">
                    Tuber Cross-Sections Validated
                  </div>
                </div>
                <div>
                  <div className="text-5xl font-black mb-2">94%</div>
                  <div className="text-violet-200 text-sm">
                    Baseline Anthocyanin Accuracy
                  </div>
                </div>
                <div>
                  <div className="text-5xl font-black mb-2">&lt;1.5s</div>
                  <div className="text-violet-200 text-sm">
                    Average Edge Inference Latency
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. ROADMAP, TEAM & CTA */}
          <section className="py-24 px-6 max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Team Matthew 937
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12">
              University of the Philippines Los Baños (UPLB). Execution-focused
              students bridging hardware, vision models, and SaaS
              infrastructure.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              <TeamMember
                name="Aldrich Devilles"
                role="Team Leader - Frontend & UI"
              />
              <TeamMember name="Gift" role="Backend & Database" />
              <TeamMember name="Jansen" role="Product Researcher" />
              <TeamMember name="Anton" role="Business Analyst" />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-xl p-8 max-w-3xl mx-auto border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-bold mb-2">Immediate Milestone</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Executing a 30-day post-hackathon pilot trial with select
                Calabarzon cooperatives to transition this ledger into a full
                DaaS platform.
              </p>
              <Button
                size="lg"
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                Contact the Team
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// --- Reusable Sub-Components ---

function PipelineStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center bg-zinc-100 dark:bg-zinc-900 pt-4">
      <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 border-4 border-zinc-100 dark:border-zinc-900 flex items-center justify-center shadow-sm mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs">
        {description}
      </p>
    </div>
  );
}

function TeamMember({ name, role }: { name: string; role: string }) {
  return (
    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="font-bold text-zinc-900 dark:text-zinc-100">{name}</div>
      <div className="text-sm text-violet-600 dark:text-violet-400 mt-1">
        {role}
      </div>
    </div>
  );
}
