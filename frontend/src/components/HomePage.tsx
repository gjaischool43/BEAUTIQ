// src/components/HomePage.tsx


// 새로 받은 섹션 컴포넌트들
import { HeroSection } from "./HeroSection";
import { SubHeroSection } from "./SubHeroSection";
import { ServiceIntro } from "./ServiceIntro";
import { DifferentiationSection } from "./DifferentiationSection";
import { FeaturesSection } from "./FeaturesSection";
import { ServiceFlow } from "./ServiceFlow";
import { ReportCards } from "./ReportCards";

interface HomePageProps {



}

export function HomePage({


}: HomePageProps) {
    return (
        <main className="pt-24 bg-white">
            {/* 1. Hero 영역 (최상단) */}
            <section>
                {/* HeroSection 내부에 CTA 버튼이 있다면
                   그 쪽에서 onClick을 직접 연결해도 되지만,
                   지금 단계에서는 UI만 쓰고 동작은 밑의 CTA에서 확실히 보장 */}
                <HeroSection />
            </section>

            {/* 2. 서브 히어로/보조 설명 영역 */}
            <section>
                <SubHeroSection />
            </section>

            {/* 4. 차별점 섹션 */}
            <section>
                <DifferentiationSection />
            </section>

            {/* 5. 기능/특징 섹션 */}
            <section id="features">
                <FeaturesSection />
            </section>

            {/* 6. 서비스 플로우 섹션 */}
            <section>
                <ServiceFlow />
            </section>

            {/* 7. 예시 리포트 섹션 (Header의 '예시 리포트' 스크롤 타겟) */}
            <section id="example-report">
                <ReportCards />

            </section>


        </main>
    );
}
