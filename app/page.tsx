// ----------- LANDING PAGE -----------

import Image from "next/image";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main>
        <Navbar></Navbar>
        <h1>Intelligent Ube Triage System</h1>
      </main>
    </div>
  );
}
