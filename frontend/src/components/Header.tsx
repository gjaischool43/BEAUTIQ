// src/components/Header.tsx

import { Button } from "./ui/button";
import logoImage from "../assets/f03808aa176a21f8455791e5e88653219d0cefbb.png";
interface HeaderProps {
    onServiceIntroClick: () => void;
    onRequestClick: () => void;
    onAdminClick: () => void;
    onLookupClick: () => void;
    onExampleClick: () => void;
    onLogoClick: () => void;
}

export function Header({
    onServiceIntroClick,
    onRequestClick,
    onAdminClick,
    onLookupClick,
    onExampleClick,
    onLogoClick,

}: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-24 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-[1200px] mx-auto px-6 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Logo */}
                    <div
                        className="cursor-pointer flex items-center"
                        onClick={onLogoClick}
                    >
                        <img
                            src={logoImage}
                            alt="BEAUTIQ"
                            className="h-20"
                        />
                    </div>

                    {/* Navigation + 우측 액션 */}
                    <div className="flex items-center gap-8">
                        {/* 메인 네비게이션 */}
                        <nav className="hidden md:flex items-center gap-10">
                            <button
                                onClick={onServiceIntroClick}
                                className="text-sm text-black hover:text-gray-600 transition-colors"
                                style={{ fontWeight: 300 }}
                            >
                                서비스 소개
                            </button>
                            <button
                                onClick={onExampleClick}
                                className="text-sm text-black hover:text-gray-600 transition-colors"
                                style={{ fontWeight: 300 }}
                            >
                                예시 리포트
                            </button>
                            <button
                                onClick={onRequestClick}
                                className="text-sm text-black hover:text-gray-600 transition-colors"
                                style={{ fontWeight: 300 }}
                            >
                                문의하기
                            </button>
                        </nav>

                        {/* 의뢰 조회 / 관리자 버튼 */}
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={onLookupClick}
                                className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                                style={{ fontWeight: 300 }}
                            >
                                의뢰 조회
                            </button>
                            <Button
                                onClick={onAdminClick}
                                className="px-4 py-2 rounded-full bg-black text-white text-sm hover:bg-gray-900 transition-colors"
                                style={{ fontWeight: 400 }}
                            >
                                관리자 페이지
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
