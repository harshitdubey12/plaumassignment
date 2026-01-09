import React from "react";

export default function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 text-xs text-slate-300">{subtitle}</div>
          ) : null}
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

