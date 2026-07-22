import React from 'react';
import { Target, ShieldCheck, Users, Award, Sparkles } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Our Vision & Mission
        </span>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">
          About <span className="gradient-text">StuVaradhi</span>
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          "Bridging Students to Success" — StuVaradhi was established to equip aspiring tech professionals with industry-driven skills, real-time code projects, and structural career guidance.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Focused Mission</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Eliminating outdated learning by delivering hands-on instruction in MERN Stack, Data Science, and DevOps.
          </p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verified Excellence</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Every registered student is evaluated via our Admin Approval System to build disciplined learning cohorts.
          </p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Career Outcome</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Graduates gain verified credentials, portfolio projects, and direct placement support into top software firms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
