import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

export async function processText(text) {
  const { data } = await api.post("/api/process", { text });
  return data;
}

export async function processImage(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/api/process", form);
  return data;
}
