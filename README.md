# AI-Powered Appointment Scheduler Assistant (MERN)

Backend: Node.js + Express + Multer + Tesseract.js + Gemini  
Frontend: React (Vite) + Tailwind CSS

## Setup

### 1) Backend (Port 5000)

```bash
cd backend
npm install
cp .env.example .env
```

Set your Gemini API key in `backend/.env`:
- `GEMINI_API_KEY=...`

Start the backend:

```bash
npm run dev
```

If port 5000 is already in use on your machine, start on 5001:

```bash
PORT=5001 npm run dev
```

Health check:

```bash
curl http://localhost:5000/health
```

### 2) Frontend (Port 5173)

```bash
cd frontend
npm install
npm run dev
```

If your backend is running on 5001, create `frontend/.env`:

```bash
cp .env.example .env
npm run dev
```

Open:
- http://localhost:5173

## API Usage

### Text (cURL)

```bash
curl -X POST http://localhost:5000/api/process \
  -H "Content-Type: application/json" \
  -d '{"text":"Book dentist next Friday at 3pm"}'
```

### Image (Postman)

1. Method: `POST`
2. URL: `http://localhost:5000/api/process`
3. Body → `form-data`
4. Key: `file` (type: File) → choose your image
5. Send

## Output Format

The response includes the full pipeline:
- `step1`: OCR/text extraction output `{ raw_text, confidence }`
- `step2`: entities `{ date_phrase, time_phrase, department }` + confidence
- `step3`: normalized `{ date, time, tz }` + confidence
- `step4`: final appointment JSON + status

Guardrail:
- `status: "needs_clarification"` with a message when required fields are missing/ambiguous.

## Screen Recording Checklist

- Start backend on port 5000 and show `/health` is OK
- Open frontend on port 5173
- Run a text example (e.g., “Book dentist next Friday at 3pm”) and show all 4 steps
- Run an image OCR example and show all 4 steps
- Show a failure/ambiguous example that returns `needs_clarification`
