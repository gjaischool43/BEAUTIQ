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

    const handleRequestClick = () => {
        setCurrentPage("request");
        window.scrollTo(0, 0);
    };

    const handleAdminClick = () => {
        setCurrentPage("admin");
        window.scrollTo(0, 0);
    };

    const handleLookupClick = () => {
        setCurrentPage("requestLookup");
        window.scrollTo(0, 0);
    };

    const handleBackToHome = () => {
        setCurrentPage("home");
        window.scrollTo(0, 0);
    };

    // 관리자에서 “준비완료” 상태 클릭 시
    const handleOpenReportDetail = (reportId: number) => {
        setSelectedReportId(reportId);
        setCurrentPage("adminReportDetail");
        window.scrollTo(0, 0);
    };

    return (
        <div>
            <Header
                onRequestClick={handleRequestClick}
                onAdminClick={handleAdminClick}
                onLookupClick={handleLookupClick}
            />

            {currentPage === "home" && <HomePage onRequestClick={handleRequestClick} />}

            {currentPage === "request" && (
                <RequestFormPage
                    onBack={handleBackToHome}
                    onSubmit={() => setCurrentPage("home")}
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

            <Toaster />
        </div>
    );
}
