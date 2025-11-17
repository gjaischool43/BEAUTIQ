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

type Page =
    | "home"
    | "request"
    | "admin"
    | "requestLookup"
    | "adminReportDetail";

export default function App() {
    const [currentPage, setCurrentPage] = useState<Page>("home");
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

    // 1) 의뢰서 작성 / 서비스소개 → 의뢰서 페이지
    const handleRequestClick = () => {
        setCurrentPage("request");
        window.scrollTo(0, 0);
    };

    // 2) 관리자 페이지
    const handleAdminClick = () => {
        setCurrentPage("admin");
        window.scrollTo(0, 0);
    };

    // 3) 리포트 조회(열람 비밀번호로 찾기)
    const handleLookupClick = () => {
        setCurrentPage("requestLookup");
        window.scrollTo(0, 0);
    };

    const handleServiceIntroClick = () => {
        // 홈 화면으로 이동
        setCurrentPage("home");

        // 렌더 완료 후 해당 섹션으로 이동
        setTimeout(() => {
            const el = document.getElementById("service");
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 50);
    };

    // 4) 홈으로 돌아가기
    const handleBackToHome = () => {
        setCurrentPage("home");
        window.scrollTo(0, 0);
    };

    // 5) 관리자에서 “준비완료” 상태 클릭 시 상세 리포트 페이지로
    const handleOpenReportDetail = (reportId: number) => {
        setSelectedReportId(reportId);
        setCurrentPage("adminReportDetail");
        window.scrollTo(0, 0);
    };

    // 6) 예시 보고서 보기 버튼
    const handleExampleReportClick = () => {
        // 홈 화면으로 이동
        setCurrentPage("home");

        // 렌더 완료 후 해당 섹션으로 이동
        setTimeout(() => {
            const el = document.getElementById("examples");
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 50);
    };

    // 7) 문의하기 버튼
    const handleContactClick = () => {
        // 문의 이메일 주소로 교체
        window.location.href = "mailto:contact@beautiq.ai";
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F7F4] text-[#262626]">
            <Header
                // 헤더의 “서비스 소개” 버튼을 onRequestClick에 물려두면
                // 클릭 시 의뢰서 작성 페이지로 이동하게 됨
                onServiceIntroClick={handleServiceIntroClick}
                onRequestClick={handleRequestClick}
                onAdminClick={handleAdminClick}
                onLookupClick={handleLookupClick}
                onExampleClick={handleExampleReportClick}
            />

            <main className="flex-1">
                {currentPage === "home" && (
                    <HomePage
                        // 의뢰서 작성 / 지금 시작하기 버튼
                        onRequestClick={handleRequestClick}
                        // 예시 보고서 버튼
                        onExampleReportClick={handleExampleReportClick}
                        // 문의하기 버튼
                        onContactClick={handleContactClick}
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
