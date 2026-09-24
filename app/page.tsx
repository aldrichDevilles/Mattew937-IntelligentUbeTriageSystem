"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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

// Reusable animation variants for scroll reveals
// Defined ONCE outside the components to prevent re-rendering glitches
const fadeUpVariant: any = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <Navbar />

      <main className="flex-1">
        {/* 1. HERO SECTION (The Hook with Scroll Sequence) */}
        <section className="relative h-[300vh]">
          <ScrollSequence />

          <div className="absolute top-0 left-0 w-full h-screen flex flex-col items-center justify-center space-y-6 text-center px-6 z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Badge
                variant="secondary"
                className="bg-mauve-500/10 text-mauve-300 hover:bg-mauve-500/20 border-mauve-500/20 mb-4 px-4 py-1.5"
              >
                UbeRated: Intelligent Ube Triage System
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl font-extrabold tracking-tight sm:text-7xl text-white drop-shadow-lg"
            >
              The New Standard <br />
              for <span className="text-mauve-400">Philippine Ube.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="max-w-2xl text-lg sm:text-xl text-zinc-200 leading-relaxed drop-shadow-md"
            >
              Rapid AI farm-gate phenotyping to preserve planting stock and
              secure fair pricing for cooperatives.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-8"
            >
              <Button
                render={<Link href="/terminal" />}
                nativeButton={false}
                size="lg"
                className="bg-mauve-600 hover:bg-mauve-700 text-white border-none h-12 px-8 text-base transition-transform hover:scale-105"
              >
                Open Grading Terminal
              </Button>

              <Button
                render={<Link href="/dashboard" />}
                nativeButton={false}
                variant="outline"
                size="lg"
                className="bg-zinc-950/40 text-white hover:text-purple-500 hover:bg-zinc-900/60 border-zinc-700 backdrop-blur-sm h-12 px-8 text-base transition-transform hover:scale-105"
              >
                View Scanned Inventory
              </Button>
            </motion.div>
          </div>
        </section>

        {/* SECTION WRAPPER FOR CONTENT BELOW HERO */}
        <div className="relative z-20 bg-background">
          {/* 2. THE CRISIS (Problem-Solution Fit) */}
          <section className="py-24 px-6 max-w-6xl mx-auto overflow-hidden">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariant as any}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                The Commodity Trap
              </h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Why the Philippine ube supply chain is losing its most vital
                resource.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer as any}
              className="grid md:grid-cols-2 gap-8"
            >
              <motion.div variants={fadeUpVariant as any}>
                <Card className="bg-muted/50 border-zinc-200 dark:border-zinc-800 h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <TrendingDown className="w-10 h-10 text-mauve-600 mb-4" />
                    <CardTitle className="text-xl">
                      The Current Reality
                    </CardTitle>
                    <CardDescription className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed">
                      Farmers sell 50kg sacks of uncalibrated tubers for
                      immediate cash. Traders guess quality by eye, sending
                      high-vitality planting materials to industrial food
                      processors, permanently draining the national seed stock.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div variants={fadeUpVariant as any}>
                <Card className="bg-mauve-50 dark:bg-mauve-950/10 border-mauve-200 dark:border-mauve-900 h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CheckCircle2 className="w-10 h-10 text-mauve-600 dark:text-mauve-500 mb-4" />
                    <CardTitle className="text-xl">
                      The UbeRated Intervention
                    </CardTitle>
                    <CardDescription className="text-zinc-700 dark:text-zinc-300 text-base leading-relaxed">
                      Intercepting harvests directly at the cooperative. We
                      instantly grade cross-sections to route premium
                      propagation seeds to certified nurseries, ensuring zero
                      waste and fair, data-backed payouts to farmers.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>
          </section>

          {/* 3. THE TRIAGE PIPELINE (How It Works) */}
          <section className="py-24 px-6 bg-muted border-y border-zinc-200 dark:border-zinc-800">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer as any}
              className="max-w-6xl mx-auto"
            >
              <motion.h2
                variants={fadeUpVariant as any}
                className="text-3xl font-bold tracking-tight text-center mb-16"
              >
                The Edge Triage Pipeline
              </motion.h2>

              <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting Line (Hidden on Mobile) */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                  className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-zinc-300 dark:bg-zinc-700 z-0 origin-left"
                />

                <PipelineStep
                  icon={
                    <Camera className="w-6 h-6 text-mauve-600 dark:text-mauve-400" />
                  }
                  title="1. Standardized Scan"
                  description="Agents capture a cross-section photo inside a low-cost, controlled lightbox directly at the farm gate."
                />
                <PipelineStep
                  icon={
                    <BrainCircuit className="w-6 h-6 text-mauve-600 dark:text-mauve-400" />
                  }
                  title="2. AI Grading"
                  description="The vision model evaluates anthocyanin density and internal rot, outputting a precise commercial grade."
                />
                <PipelineStep
                  icon={
                    <Database className="w-6 h-6 text-mauve-600 dark:text-mauve-400" />
                  }
                  title="3. Instant Ledger"
                  description="Data is pushed to a live inventory feed. Farmers receive immediate Twilio SMS payout receipts."
                />
              </div>
            </motion.div>
          </section>

          {/* 4. THE CORE VIEWS (The Live Demo) */}
          <section className="py-24 px-6 max-w-6xl mx-auto">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant as any}
              className="text-3xl font-bold tracking-tight text-center mb-16"
            >
              Dual-Sided Value
            </motion.h2>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer as any}
              className="grid md:grid-cols-2 gap-8"
            >
              <motion.div variants={fadeUpVariant as any}>
                <Card className="group overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-full hover:border-mauve-500/50 transition-colors">
                  <div className="h-48 bg-muted flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <Sprout className="w-16 h-16 text-zinc-400 group-hover:text-mauve-500 group-hover:scale-110 transition-all duration-500" />
                  </div>
                  <CardHeader>
                    <CardTitle>Grading Terminal</CardTitle>
                    <CardDescription className="leading-relaxed">
                      A frictionless, agent-facing edge capture interface.
                      Upload cross-sections, receive instant AI grading, and
                      automate farmer SMS payouts.
                    </CardDescription>
                    <Button
                      variant="link"
                      render={<Link href="/terminal" />}
                      nativeButton={false}
                      className="p-0 h-auto text-mauve-600 dark:text-mauve-400 mt-4 justify-start group/btn"
                    >
                      Launch Terminal{" "}
                      <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div variants={fadeUpVariant as any}>
                <Card className="group overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 relative h-full hover:border-mauve-500/50 transition-colors">
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-mauve-600 hover:bg-mauve-700 text-white text-xs px-2 py-1 shadow-md">
                      DaaS & B2B Integration
                    </Badge>
                  </div>
                  <div className="h-48 bg-muted flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <LineChart className="w-16 h-16 text-zinc-400 group-hover:text-mauve-500 group-hover:scale-110 transition-all duration-500" />
                  </div>
                  <CardHeader>
                    <CardTitle>Global Inventory Ledger</CardTitle>
                    <CardDescription className="leading-relaxed">
                      A unified, read-only feed of all scanned batches. A
                      foundational view ready to scale into a gated SaaS
                      marketplace for food processors.
                    </CardDescription>
                    <Button
                      variant="link"
                      render={<Link href="/dashboard" />}
                      className="p-0 h-auto text-mauve-600 dark:text-mauve-400 mt-4 justify-start group/btn"
                    >
                      View Ledger{" "}
                      <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>
          </section>

          {/* 5. ARCHITECTURE & DEPLOYMENT */}
          <section className="py-20 px-6 bg-mauve-600 dark:bg-mauve-900 text-white text-center overflow-hidden">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer as any}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                variants={fadeUpVariant as any}
                className="text-sm font-bold tracking-widest uppercase text-mauve-200 mb-4"
              >
                Phase 1: Edge-Ready Foundation
              </motion.h2>
              <div className="grid sm:grid-cols-3 gap-8 mt-8">
                <motion.div variants={fadeUpVariant as any}>
                  <div className="text-5xl font-black mb-2">Live</div>
                  <div className="text-mauve-200 text-sm">
                    Real-Time Supabase Ledger Sync
                  </div>
                </motion.div>
                <motion.div variants={fadeUpVariant as any}>
                  <div className="text-5xl font-black mb-2">100%</div>
                  <div className="text-mauve-200 text-sm">
                    Hardware Agnostic (Web-Native Camera)
                  </div>
                </motion.div>
                <motion.div variants={fadeUpVariant as any}>
                  <div className="text-5xl font-black mb-2">v0.1</div>
                  <div className="text-mauve-200 text-sm">
                    Iterative Vision Model Pipeline
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* 6. ROADMAP, TEAM & CTA */}
          <section className="py-24 px-6 max-w-6xl mx-auto text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariant as any}
            >
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Team Matthew 937
              </h2>
              <div className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12 space-y-4">
                <p className="text-lg italic font-medium text-foreground">
                  "The harvest is plentiful, but the workers are few." — Matthew
                  9:37
                </p>
                <p>
                  As Christian students from the University of the Philippines
                  Los Baños (UPLB), we are answering that call. We are
                  execution-focused builders bridging hardware, vision models,
                  and SaaS infrastructure to create real-world solutions.
                </p>
                <p>
                  We believe the next generation is worth fighting for. True
                  national transformation begins when we invest in future
                  leaders, equipping them with Leadership, Integrity, Faith, and
                  Excellence.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer as any}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
            >
              <TeamMember
                name="Aldrich Devilles"
                role="Team Leader - Frontend & UI"
              />
              <TeamMember name="Gift Perez" role="Backend & Database" />
              <TeamMember name="Jansen Hernandez" role="Product Researcher" />
              <TeamMember name="Anton Mongaya" role="Business Analyst" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-muted/50 rounded-xl p-8 max-w-3xl mx-auto border border-zinc-200 dark:border-zinc-800 hover:border-mauve-200 dark:hover:border-mauve-800 transition-colors"
            >
              <h3 className="text-xl font-bold mb-2">Join the Work</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                As opportunities arise to refine and expand this platform, we
                are actively welcoming new ideas. Sharing the same vision for
                the future of agriculture? Connect with us to collaborate.
              </p>
              <Button
                render={<a href="mailto:aldevilles@up.edu.ph" />}
                nativeButton={false}
                size="lg"
                className="bg-mauve-600 hover:bg-mauve-700 text-white transition-transform hover:scale-105"
              >
                Let's Collaborate
              </Button>
            </motion.div>
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
    <motion.div
      variants={fadeUpVariant as any}
      className="relative z-10 flex flex-col items-center text-center bg-muted pt-4 group"
    >
      <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 border-4 border-zinc-100 dark:border-zinc-900 flex items-center justify-center shadow-sm mb-6 group-hover:border-mauve-200 dark:group-hover:border-mauve-900 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs">
        {description}
      </p>
    </motion.div>
  );
}

function TeamMember({ name, role }: { name: string; role: string }) {
  return (
    <motion.div
      variants={fadeUpVariant as any}
      className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-mauve-300 dark:hover:border-mauve-800 transition-colors"
    >
      <div className="font-bold text-zinc-900 dark:text-zinc-100">{name}</div>
      <div className="text-sm text-mauve-600 dark:text-mauve-400 mt-1">
        {role}
      </div>
    </motion.div>
  );
}
