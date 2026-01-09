import express from "express";
import multer from "multer";
import { z } from "zod";
import { extractTextFromImage } from "../services/ocr.js";
import { extractEntitiesWithLlm, normalizeWithLlm } from "../services/llm.js";
import { mapDepartment } from "../services/department.js";
import { isValidIsoDate, isValidTimeHHmm } from "../services/validate.js";
import {
  fallbackExtractEntities,
  fallbackNormalize
} from "../services/fallback.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      const err = new Error(
        "Unsupported file type. Use png, jpg/jpeg, or webp."
      );
      err.status = 400;
      cb(err);
      return;
    }
    cb(null, true);
  }
});

const BodySchema = z.object({
  text: z.string().min(1).max(5000).optional()
});

export const processRouter = express.Router();

processRouter.post("/process", upload.single("file"), async (req, res, next) => {
  try {
    const parse = BodySchema.safeParse(req.body ?? {});
    if (!parse.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid request body"
      });
    }

    const now = new Date();
    const currentDateIso = now.toISOString().slice(0, 10);
    const tz = "Asia/Kolkata";

    const step1 = req.file
      ? await extractTextFromImage(req.file.buffer)
      : parse.data.text
          ? { raw_text: String(parse.data.text), confidence: 0.9 }
          : null;

    if (!step1) {
      return res.status(400).json({
        status: "error",
        message: "Provide either JSON body {text} or a file upload"
      });
    }

    let step2;
    try {
      step2 = await extractEntitiesWithLlm({
        rawText: step1.raw_text,
        currentDateIso,
        tz
      });
    } catch {
      step2 = fallbackExtractEntities(step1.raw_text);
    }

    const hasRequiredEntities =
      Boolean(step2.entities?.date_phrase) &&
      Boolean(step2.entities?.time_phrase) &&
      Boolean(step2.entities?.department);

    if (!hasRequiredEntities) {
      return res.json({
        step1,
        step2,
        step3: null,
        step4: null,
        status: "needs_clarification",
        message: "Ambiguous date/time or department"
      });
    }

    let step3;
    try {
      step3 = await normalizeWithLlm({
        entities: step2.entities,
        currentDateIso,
        tz
      });
    } catch {
      step3 = fallbackNormalize({
        entities: step2.entities,
        currentDateIso,
        tz
      });
    }

    const normalizedOk =
      isValidIsoDate(step3.normalized?.date) &&
      isValidTimeHHmm(step3.normalized?.time) &&
      step3.normalized?.tz === tz;

    if (!normalizedOk) {
      return res.json({
        step1,
        step2,
        step3,
        step4: null,
        status: "needs_clarification",
        message: "Ambiguous date/time or department"
      });
    }

    const appointment = {
      department: mapDepartment(step2.entities.department),
      date: step3.normalized.date,
      time: step3.normalized.time,
      tz
    };

    return res.json({
      step1,
      step2,
      step3,
      step4: {
        appointment,
        status: "ok"
      },
      status: "ok"
    });
  } catch (e) {
    next(e);
  }
});
