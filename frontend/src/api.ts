// frontend/src/api.ts
import axios from "axios";

// Vite는 VITE_ 접두만 노출됨
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const api = axios.create({ baseURL });