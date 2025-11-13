// Header.tsx
import { Button } from "./ui/button";

interface HeaderProps {
    onContactClick?: () => void;
}

export function Header({ onContactClick }: HeaderProps) {
    return (
        <header className="border-b border-border bg-background sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <h1 className="text-primary text-lg font-semibold">BrandLaunch AI</h1>
                    <nav className="hidden md:flex items-center gap-8">
                        <a
                            href="#service"
                            className="text-foreground/70 hover:text-foreground transition-colors"
                        >
                            서비스 소개
                        </a>
                        <a
                            href="#examples"
                            className="text-foreground/70 hover:text-foreground transition-colors"
                        >
                            예시 보고서
                        </a>
                        <a
                            href="#contact"
                            className="text-foreground/70 hover:text-foreground transition-colors"
                        >
                            문의하기
                        </a>
                    </nav>
                </div>

                <Button
                    onClick={onContactClick}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    문의하기
                </Button>
            </div>
        </header>
    );
}
