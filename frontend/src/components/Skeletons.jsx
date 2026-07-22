import React from 'react';

export const CourseSkeleton = () => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 p-4 space-y-4 animate-pulse">
      <div className="w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4" />
      </div>
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div className="w-full space-y-3 animate-pulse p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl w-full" />
      ))}
    </div>
  );
};
