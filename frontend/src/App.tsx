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

    return (
        <div className="min-h-screen flex flex-col">
            {currentPage === "home" && (
                <>
                    <Header onContactClick={handleRequestClick} />
                    <main className="flex-1">
                        <HomePage onRequestClick={handleRequestClick} />
                    </main>
                    <Footer />

                    {/* 숨겨진 관리자 버튼 */}
                    <button
                        onClick={handleAdminClick}
                        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
                        title="관리자 페이지"
                    >
                        관리자페이지
                    </button>
                </>
            )}

            {currentPage === "request" && (
                <RequestFormPage onBack={handleBackToHome} onSubmit={handleFormSubmit} />
            )}

            {currentPage === "admin" && (
                <AdminPage onBack={handleBackToHome} submissions={submissions} />
            )}

            <Toaster />
        </div>
    );
}
