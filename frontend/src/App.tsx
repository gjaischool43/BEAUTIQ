// src/App.tsx
import { useState } from "react";

import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/HomePage";
import { RequestFormPage, FormData } from "./components/RequestFormPage";
import { AdminPage } from "./components/AdminPage";
import { Toaster } from "./components/ui/sonner";

type Page = "home" | "request" | "admin";

export default function App() {
    const [currentPage, setCurrentPage] = useState<Page>("home");
    const [submissions, setSubmissions] = useState<FormData[]>([]);

    const handleRequestClick = () => {
        setCurrentPage("request");
        window.scrollTo(0, 0);
    };

    const handleAdminClick = () => {
        setCurrentPage("admin");
        window.scrollTo(0, 0);
    };

    const handleBackToHome = () => {
        setCurrentPage("home");
        window.scrollTo(0, 0);
    };

    const handleFormSubmit = (formData: FormData) => {
        setSubmissions((prev) => [...prev, formData]);
    };

    let pageNode;
    if (currentPage === "home") {
        pageNode = (
            <HomePage
                onRequestClick={handleRequestClick}
            />
        );
    } else if (currentPage === "request") {
        pageNode = (
            <RequestFormPage
                onBack={handleBackToHome}
                onSubmit={handleFormSubmit}
            />
        );
    } else {
        pageNode = (
            <AdminPage
                onBack={handleBackToHome}
                submissions={submissions}
            />
        );
    }

    return (
        <>
            <div className="min-h-screen flex flex-col">
                {/* 헤더는 모든 페이지에 공통으로 */}
                <Header onContactClick={handleRequestClick} />

                {/* 페이지별 내용 */}
                <main className="flex-1">
                    {pageNode}
                </main>

                <Footer />

                {/* 숨겨진 관리자 버튼은 홈일 때만 노출 */}
                {currentPage === "home" && (
                    <button
                        onClick={handleAdminClick}
                        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
                        title="관리자 페이지"
                    >
                        관리자페이지
                    </button>
                )}
            </div>

            {/* Toaster는 자식 없이 단독으로 */}
            <Toaster />
        </>
    );
}
