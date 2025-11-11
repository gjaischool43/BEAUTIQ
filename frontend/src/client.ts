import axios from "axios";

// 배포 시 환경 변수로 API 기본 URL을 주입하는 패턴
// Vite는 VITE_ 접두만 import.meta.env 에 노출됨
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const api = axios.create({ baseURL });