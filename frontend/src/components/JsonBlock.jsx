import React from "react";

export default function JsonBlock({ value }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-lg bg-slate-950/60 p-3 text-xs leading-5 text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

