import { createRoot } from "react-dom/client"; // ← 이건 '패키지 내부 경로' 임포트 (설치 대상 아님)
import App from "./App";                       // 절대경로(X) 상대경로(O)
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
