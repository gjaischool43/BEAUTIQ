// Footer.tsx
import { Mail, MessageCircle } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-muted/30 border-t border-border">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-primary mb-4 font-semibold">BrandLaunch AI</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            인플루언서의 데이터 기반 리뷰를 분석하여<br />
                            맞춤형 화장품 브랜드 론칭 전략을 제안합니다.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Contact</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <span>contact@brandlaunch.ai</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MessageCircle className="w-4 h-4" />
                                <span>카카오톡 상담</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Social</h4>
                        <div className="flex gap-4">
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Instagram
                            </a>
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                YouTube
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
                    <p>© 2025 BrandLaunch AI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
