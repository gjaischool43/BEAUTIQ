// src/components/Footer.tsx

export function Footer() {
    return (
        <footer className="py-16 bg-white border-t border-gray-200">
            <div className="max-w-[1200px] mx-auto px-6">

                {/* 상단 영역 */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

                    {/* 브랜드 소개 */}
                    <div>
                        <div
                            className="text-xl tracking-wider mb-2"
                            style={{ fontWeight: 300 }}
                        >
                            BEAUTIQ
                        </div>
                        <p
                            className="text-sm text-gray-500"
                            style={{ fontWeight: 300 }}
                        >
                            AI 기반 뷰티 크리에이터 브랜드 컨설팅 플랫폼
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="flex gap-8">
                        <a
                            href="mailto:contact@beautiq.ai"
                            className="text-sm text-gray-600 hover:text-black transition-colors"
                            style={{ fontWeight: 300 }}
                        >
                            contact@beautiq.ai
                        </a>
                    </div>

                </div>

                {/* 하단 카피라이트 */}
                <div
                    className="mt-12 pt-8 border-t border-gray-200 text-xs text-gray-400 text-center"
                    style={{ fontWeight: 300 }}
                >
                    © 2024 BEAUTIQ. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
