import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { safeJsonParse } from "./safeJson.js";

const EntitiesSchema = z.object({
  entities: z.object({
    date_phrase: z.string().min(1).nullable(),
    time_phrase: z.string().min(1).nullable(),
    department: z.string().min(1).nullable()
  }),
  entities_confidence: z.number().min(0).max(1)
});

const NormalizationSchema = z.object({
  normalized: z.object({
    date: z.string().min(1).nullable(),
    time: z.string().min(1).nullable(),
    tz: z.string().min(1).nullable()
  }),
  normalization_confidence: z.number().min(0).max(1)
});

function ensureGeminiKey() {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error("Missing GEMINI_API_KEY");
    err.status = 500;
    throw err;
  }
}

async function callLlmJson({ system, user, schema }) {
  ensureGeminiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const resp = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${system}\n\n${user}`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 700
    }
  });

  const text = String(resp?.text ?? "").trim();
  const json = safeJsonParse(text);
  return schema.parse(json);
}

export async function extractEntitiesWithLlm({ rawText, currentDateIso, tz }) {
  const system =
    "You extract appointment entities from user text. Return only valid JSON.";
  const user = JSON.stringify(
    {
      task: "extract_entities",
      current_date: currentDateIso,
      timezone: tz,
      raw_text: rawText,
      output_contract: {
        entities: {
          date_phrase: "string or null",
          time_phrase: "string or null",
          department: "string or null"
        },
        entities_confidence: "number 0..1"
      },
      rules: [
        "Use the raw_text only.",
        "If missing or unclear, output null for that field.",
        "Department should be a short noun like dentist, cardiology, dermatologist.",
        "Confidence reflects how complete and unambiguous the extraction is."
      ],
      examples: [
        {
          input: "Book dentist next Friday at 3pm",
          output: {
            entities: {
              date_phrase: "next Friday",
              time_phrase: "3pm",
              department: "dentist"
            },
            entities_confidence: 0.85
          }
        }
      ]
    },
    null,
    2
  );

  const parsed = await callLlmJson({ system, user, schema: EntitiesSchema });
  return {
    entities: {
      date_phrase: parsed.entities.date_phrase,
      time_phrase: parsed.entities.time_phrase,
      department: parsed.entities.department
    },
    entities_confidence: parsed.entities_confidence
  };
}

export async function normalizeWithLlm({ entities, currentDateIso, tz }) {
  const system =
    "You normalize appointment date/time phrases. Return only valid JSON.";
  const user = JSON.stringify(
    {
      task: "normalize_datetime",
      current_date: currentDateIso,
      timezone: tz,
      entities,
      output_contract: {
        normalized: {
          date: "YYYY-MM-DD or null",
          time: "HH:mm 24h or null",
          tz: "must be Asia/Kolkata"
        },
        normalization_confidence: "number 0..1"
      },
      rules: [
        "Compute relative dates using current_date as the reference date.",
        "If date_phrase is relative (next Friday, tomorrow), resolve it to an absolute YYYY-MM-DD.",
        "If time_phrase uses am/pm, convert to 24h HH:mm.",
        "If unclear (e.g., missing time), return null for that field.",
        "tz must be Asia/Kolkata if any fields are present."
      ],
      examples: [
        {
          current_date: "2025-09-20",
          entities: {
            date_phrase: "next Friday",
            time_phrase: "3pm",
            department: "dentist"
          },
          output: {
            normalized: { date: "2025-09-26", time: "15:00", tz: "Asia/Kolkata" },
            normalization_confidence: 0.9
          }
        }
      ]
    },
    null,
    2
  );

  const parsed = await callLlmJson({
    system,
    user,
    schema: NormalizationSchema
  });

  return {
    normalized: {
      date: parsed.normalized.date,
      time: parsed.normalized.time,
      tz: parsed.normalized.tz
    },
    normalization_confidence: parsed.normalization_confidence
  };
}
