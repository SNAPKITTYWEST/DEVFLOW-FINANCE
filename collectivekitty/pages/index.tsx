import React from 'react';
import Head from 'next/head';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#00D4AA]/30">
      <Head>
        <title>SnapKitty | The Operating System for High-Velocity Teams</title>
      </Head>

      {/* SECTION 1 — HERO */}
      <section className="bg-[#0a0a0a] pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto">
            The Operating System for <span className="text-[#00D4AA]">High-Velocity</span> Teams
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto">
            CRM. ERP. Procurement. Payments. One platform.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="/login"
              className="px-8 py-4 bg-[#00D4AA] text-black font-bold rounded-md hover:bg-[#00b894] transition-all w-full md:w-auto text-center"
            >
              Start Free
            </a>
            <a
              href="/demo"
              className="px-8 py-4 border border-[#00D4AA] text-[#00D4AA] font-bold rounded-md hover:bg-[#00D4AA]/10 transition-all w-full md:w-auto text-center"
            >
              See Demo
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 2 — STATS BAR */}
      <section className="bg-zinc-950 border-y border-zinc-900 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center font-mono">
          <div className="space-y-1">
            <div className="text-3xl md:text-4xl font-bold text-[#00D4AA] tracking-tighter">$2.4M</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Revenue Tracked</div>
          </div>
          <div className="space-y-1 border-y md:border-y-0 md:border-x border-zinc-900 py-6 md:py-0">
            <div className="text-3xl md:text-4xl font-bold text-[#00D4AA] tracking-tighter">1,200+</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Deals Closed</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl md:text-4xl font-bold text-[#00D4AA] tracking-tighter">99.9%</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Uptime</div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — FEATURES */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 group">
              <div className="w-12 h-12 bg-[#00D4AA]/10 border border-[#00D4AA]/20 flex items-center justify-center rounded-lg group-hover:border-[#00D4AA]/50 transition-all">
                <span className="text-[#00D4AA] text-xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">CRM Pipeline</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Track every deal from lead to close. Kanban pipeline with real-time updates.
              </p>
            </div>

            <div className="space-y-4 group">
              <div className="w-12 h-12 bg-[#00D4AA]/10 border border-[#00D4AA]/20 flex items-center justify-center rounded-lg group-hover:border-[#00D4AA]/50 transition-all">
                <span className="text-[#00D4AA] text-xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Project ERP</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Link every project to a deal. Time tracking, budgets, milestones.
              </p>
            </div>

            <div className="space-y-4 group">
              <div className="w-12 h-12 bg-[#00D4AA]/10 border border-[#00D4AA]/20 flex items-center justify-center rounded-lg group-hover:border-[#00D4AA]/50 transition-all">
                <span className="text-[#00D4AA] text-xl">💳</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Smart Procurement</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Purchase orders, vendor management, 3-way matching. Built in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="py-24 px-6 bg-[#0a0a0a] border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs font-bold text-center mb-16 uppercase tracking-[0.5em] text-zinc-500">Workflow</h2>
          <div className="space-y-16">
            <div className="flex gap-8 items-start">
              <div className="w-10 h-10 rounded-full border border-[#00D4AA] flex items-center justify-center flex-shrink-0 font-mono text-[#00D4AA] text-sm">01</div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">Connect</h4>
                <p className="text-zinc-400 text-sm">Link LinkedIn, Entra ID, your bank</p>
              </div>
            </div>
            <div className="flex gap-8 items-start">
              <div className="w-10 h-10 rounded-full border border-[#00D4AA] flex items-center justify-center flex-shrink-0 font-mono text-[#00D4AA] text-sm">02</div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">Track</h4>
                <p className="text-zinc-400 text-sm">Every deal, project, payment in one place</p>
              </div>
            </div>
            <div className="flex gap-8 items-start">
              <div className="w-10 h-10 rounded-full border border-[#00D4AA] flex items-center justify-center flex-shrink-0 font-mono text-[#00D4AA] text-sm">03</div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">Close</h4>
                <p className="text-zinc-400 text-sm">From lead to paid invoice automatically</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — CTA BANNER */}
      <section className="py-24 px-6 bg-[#00D4AA]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter">Ready to Deploy?</h2>
          <div className="flex flex-col items-center gap-6">
            <a
              href="/login"
              className="px-10 py-5 bg-black text-white font-bold rounded-md hover:bg-zinc-900 transition-all uppercase tracking-[0.2em] text-sm shadow-2xl"
            >
              Deploy to Collective
            </a>
            <p className="text-black/60 text-[10px] font-bold uppercase tracking-widest">
              SSO via Microsoft Entra ID. Free to start.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6 — FOOTER */}
      <footer className="py-12 px-6 border-t border-zinc-900 bg-black text-zinc-600 text-[9px] uppercase tracking-[0.3em] font-mono">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>SnapKitty © 2024</div>
          <div className="flex gap-10">
            <a href="#" className="hover:text-[#00D4AA] transition-colors">Product</a>
            <a href="#" className="hover:text-[#00D4AA] transition-colors">Docs</a>
            <a href="/login" className="hover:text-[#00D4AA] transition-colors">Login</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
