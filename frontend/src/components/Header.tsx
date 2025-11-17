// src/components/Header.tsx
import { Button } from "./ui/button";

interface HeaderProps {
    onRequestClick: () => void;
    onAdminClick: () => void;
    onLookupClick: () => void;   // 새로 추가
}

export function Header({ onRequestClick, onAdminClick, onLookupClick }: HeaderProps) {
    return (
        <header className="w-full border-b bg-background">
            <div className="container mx-auto flex items-center justify-between py-4 px-6">
                <div className="font-bold text-xl">BEAUTIQ</div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onRequestClick}>
                        서비스 소개
                    </Button>
                    <Button variant="ghost">
                        예시 보고서
                    </Button>
                    <Button variant="ghost">
                        문의하기
                    </Button>
                    {/* 의뢰 조회 버튼 */}
                    <Button variant="outline" onClick={onLookupClick}>
                        의뢰 조회
                    </Button>
                    <Button variant="secondary" onClick={onAdminClick}>
                        관리자 페이지
                    </Button>
                </div>
            </div>
        </header>
    );
}
