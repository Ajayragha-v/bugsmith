import Link from "next/link";
import WorkingSection from "@/components/WorkingSection";

export const metadata = {
  title: "Working of Bugsmith — Inside the Intelligence That Engineers Better Code",
  description:
    "Bugsmith transforms an existing codebase into an evolving engineering environment where specialized agents analyze changes, execute transformations, detect regressions, and verify outcomes through deterministic evaluation.",
};

export default function WorkingPage() {
  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      {/* Top Header */}
      <header className="relative z-30 w-full px-6 sm:px-10 md:px-14 h-24 flex items-center justify-between border-b border-white/[0.08] bg-[#07070a]/90 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-orange-500/90 shadow-[0_0_14px_#ff6600]" />
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 shadow-[0_0_8px_#ffaa00]" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white group-hover:text-white transition">
            Bugsmith<span className="text-orange-500">.</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-normal text-zinc-400 tracking-wide">
          <Link href="/" className="hover:text-white transition">
            Home
          </Link>
          <a href="#stage-01" className="hover:text-white transition">
            01 Ingestion
          </a>
          <a href="#stage-02" className="hover:text-white transition">
            02 Agent Swarm
          </a>
          <a href="#stage-03" className="hover:text-white transition">
            03 Coordination
          </a>
          <a href="#stage-04" className="hover:text-white transition">
            04 Verification
          </a>
          <a href="#stage-05" className="hover:text-white transition">
            05 Forensics
          </a>
          <a href="#stage-06" className="hover:text-white transition">
            06 Learning Loop
          </a>
        </nav>

        <div className="flex items-center flex-shrink-0">
          <Link
            href="/repair"
            className="whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide bg-white/95 hover:bg-white text-black transition shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-[1.03]"
          >
            Try it now
          </Link>
        </div>
      </header>

      {/* Main Pipeline Section */}
      <main>
        <WorkingSection />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-[#050508] py-12 px-6 sm:px-10 lg:px-16 text-zinc-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white tracking-tight text-sm">
              Bugsmith<span className="text-orange-500">.</span>
            </span>
            <span className="text-xs text-zinc-600">|</span>
            <span className="text-xs text-zinc-500 font-mono">Stratified Git-Forensic Swarm</span>
          </div>
          <div className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} Bugsmith Systems. Deterministic Zero-LLM Grading.
          </div>
        </div>
      </footer>
    </div>
  );
}
