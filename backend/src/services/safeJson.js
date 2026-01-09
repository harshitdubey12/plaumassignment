export function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const slice = text.slice(first, last + 1);
      return JSON.parse(slice);
    }
    throw new Error("LLM returned non-JSON output");
  }
}

