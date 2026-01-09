import React, { useMemo, useState } from "react";
import Card from "./components/Card.jsx";
import JsonBlock from "./components/JsonBlock.jsx";
import { processImage, processText } from "./lib/api.js";

function formatConfidence(c) {
  if (typeof c !== "number") return "—";
  return `${Math.round(c * 100)}%`;
}

export default function App() {
  const [text, setText] = useState("Book dentist next Friday at 3pm");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(() => {
    return Boolean((text && text.trim().length > 0) || file);
  }, [text, file]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = file ? await processImage(file) : await processText(text);
      setResult(data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Request failed. Check backend logs.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  const step1Subtitle = result?.step1
    ? `confidence: ${formatConfidence(result.step1.confidence)}`
    : "";
  const step2Subtitle = result?.step2
    ? `confidence: ${formatConfidence(result.step2.entities_confidence)}`
    : "";
  const step3Subtitle = result?.step3
    ? `confidence: ${formatConfidence(result.step3.normalization_confidence)}`
    : "";
  const step4Subtitle = result?.step4 ? `status: ${result.step4.status}` : "";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Appointment Scheduler Assistant
          </h1>
          <p className="text-sm text-slate-300">
            OCR → Entities → Normalization (Asia/Kolkata) → Final Appointment JSON
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 grid gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4 md:grid-cols-2"
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-200">
              Text Input
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Type an appointment request..."
              className="w-full resize-none rounded-lg border-slate-700 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
            />
            <div className="text-xs text-slate-400">
              Leave empty if you upload an image.
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-200">
              Image Upload (OCR)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full rounded-lg border border-slate-700 bg-slate-950/40 text-sm text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-700"
            />
            <div className="text-xs text-slate-400">
              Upload an image of a note/email (noisy text supported).
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Processing..." : "Process"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setText("");
                  setFile(null);
                  setResult(null);
                  setError("");
                }}
                className="rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-semibold text-slate-100"
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-800/60 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card title="Step 1 — OCR/Text Extraction" subtitle={step1Subtitle}>
            <JsonBlock value={result?.step1 ?? { raw_text: null, confidence: null }} />
          </Card>

          <Card title="Step 2 — Entity Extraction (LLM)" subtitle={step2Subtitle}>
            <JsonBlock
              value={
                result?.step2 ?? {
                  entities: { date_phrase: null, time_phrase: null, department: null },
                  entities_confidence: null
                }
              }
            />
          </Card>

          <Card title="Step 3 — Normalization (Asia/Kolkata)" subtitle={step3Subtitle}>
            <JsonBlock
              value={
                result?.step3 ?? {
                  normalized: { date: null, time: null, tz: "Asia/Kolkata" },
                  normalization_confidence: null
                }
              }
            />
          </Card>

          <Card title="Step 4 — Final Appointment JSON" subtitle={step4Subtitle}>
            <JsonBlock
              value={
                result?.step4 ?? {
                  appointment: null,
                  status: result?.status || "needs_clarification"
                }
              }
            />
            {result?.status === "needs_clarification" ? (
              <div className="mt-3 text-xs text-amber-200">
                {result.message || "Ambiguous date/time or department"}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

