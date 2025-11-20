// src/App.tsx
import { useState } from "react";

import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/HomePage";
import { RequestFormPage, FormData } from "./components/RequestFormPage";
import { AdminPage } from "./components/AdminPage";
import { RequestLookupPage } from "./components/RequestLookupPage";
import { AdminReportDetailPage } from "./components/AdminReportDetailPage";
import { Toaster } from "./components/ui/sonner";
import { AdminAuthPage } from "./components/AdminAuthPage"


type Page =
    | "home"
    | "request"
    | "admin"
    | "adminAuth"
    | "requestLookup"
    | "adminReportDetail";

export default function App() {
    const [currentPage, setCurrentPage] = useState<Page>("home");
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
    const [isAdminAuthed, setIsAdminAuthed] = useState(false);

    // 공통 스크롤 헬퍼: 홈으로 전환한 뒤 특정 섹션으로 부드럽게 이동
    const scrollToSection = (sectionId: string) => {
        // 홈 화면으로 이동
        setCurrentPage("home");

        // 렌더가 끝난 뒤 DOM에서 섹션 찾아서 스크롤
        setTimeout(() => {
            const el = document.getElementById(sectionId);
            if (!el) return;

            // 고정 헤더 높이를 약 72px 정도로 가정하고 살짝 위 여백을 둠
            const headerOffset = 72;
            const rect = el.getBoundingClientRect();
            const offsetTop = rect.top + window.scrollY - headerOffset;

            window.scrollTo({
                top: offsetTop,
                behavior: "smooth",
            });
        }, 0);
    };

    // 1) 의뢰서 작성 / 서비스소개 → 의뢰서 페이지
    const handleRequestClick = () => {
        setCurrentPage("request");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // 2) 관리자 페이지
    const handleAdminClick = () => {
        setCurrentPage("admin");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // 3) 리포트 조회(열람 비밀번호로 찾기)
    const handleLookupClick = () => {
        setCurrentPage("requestLookup");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleServiceIntroClick = () => {
        scrollToSection("features");          // 아래 HomePage에서 id="features"로 맞춰줄 것
    };

    // 4) 홈으로 돌아가기
    const handleBackToHome = () => {
        setCurrentPage("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // 5) 관리자에서 “준비완료” 상태 클릭 시 상세 리포트 페이지로
    const handleOpenReportDetail = (reportId: number) => {
        setSelectedReportId(reportId);
        setCurrentPage("adminReportDetail");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // 6) 예시 보고서 보기 버튼
    const handleExampleReportClick = () => {
        // 홈 화면으로 이동

        scrollToSection("example-report");
    };

    //7) 로고 클릭시 hero 랜딩
    const handleHero = () => {
        scrollToSection("hero");
    };

    // 관리자 비밀번호 인증 성공 시 호출
    const handleAdminAuthSuccess = () => {
        setIsAdminAuthed(true);
        setCurrentPage("admin");
        window.scrollTo(0, 0);
    };

    return (
        <div className="min-h-screen flex flex-col pt-[64px] bg-[#F9F7F4] text-[#262626]">
            <Header
                // 헤더의 “서비스 소개” 버튼을 onRequestClick에 물려두면
                // 클릭 시 의뢰서 작성 페이지로 이동하게 됨
                onServiceIntroClick={handleServiceIntroClick}
                onRequestClick={handleRequestClick}
                onAdminClick={handleAdminClick}
                onLookupClick={handleLookupClick}
                onExampleClick={handleExampleReportClick}
                onLogoClick={handleHero}
            />

            <main className="flex-1">
                {currentPage === "home" && (
                    <HomePage



                    />
                )}

                {currentPage === "request" && (
                    <RequestFormPage
                        onBack={handleBackToHome}
                        onSubmit={(_formData: FormData) => {
                            // 필요하면 formData를 여기서 활용
                            setCurrentPage("home");
                        }}
                    />
                )}

                {currentPage === "adminAuth" && (
                    <AdminAuthPage
                        onBack={handleBackToHome}
                        onSuccess={handleAdminAuthSuccess}
                    />
                )}

                {currentPage === "admin" && (
                    <AdminPage
                        onBack={handleBackToHome}
                        onOpenReportDetail={handleOpenReportDetail}
                    />
                )}

                {currentPage === "requestLookup" && (
                    <RequestLookupPage onBack={handleBackToHome} />
                )}

                {currentPage === "adminReportDetail" && selectedReportId && (
                    <AdminReportDetailPage
                        reportId={selectedReportId}
                        onBack={() => setCurrentPage("admin")}
                    />
                )}
            </main>

            <Footer />
            <Toaster position="top-center" richColors />
        </div>
    );
}
