// src/components/HomePage.tsx
import { Button } from "./ui/button";

// 새로 받은 섹션 컴포넌트들
import { HeroSection } from "./HeroSection";
import { SubHeroSection } from "./SubHeroSection";
import { ServiceIntro } from "./ServiceIntro";
import { DifferentiationSection } from "./DifferentiationSection";
import { FeaturesSection } from "./FeaturesSection";
import { ServiceFlow } from "./ServiceFlow";
import { ReportCards } from "./ReportCards";
import { OperationInfo } from "./OperationInfo";

interface HomePageProps {
    onRequestClick: () => void;
    onExampleReportClick: () => void;
    onContactClick: () => void;

}

export function HomePage({
    onRequestClick,
    onExampleReportClick,
    onContactClick,
}: HomePageProps) {
    return (
        <main className="pt-24 bg-white">
            {/* 1. Hero 영역 (최상단) */}
            <section>
                {/* HeroSection 내부에 CTA 버튼이 있다면
                   그 쪽에서 onClick을 직접 연결해도 되지만,
                   지금 단계에서는 UI만 쓰고 동작은 밑의 CTA에서 확실히 보장 */}
                <HeroSection onRequestClick={onContactClick} />
            </section>

            {/* 2. 서브 히어로/보조 설명 영역 */}
            <section>
                <SubHeroSection />
            </section>

            {/* 3. 서비스 소개 섹션 (Header의 '서비스 소개' 스크롤 타겟) */}
            <section id="service-intro">
                <ServiceIntro />
            </section>

            {/* 4. 차별점 섹션 */}
            <section>
                <DifferentiationSection />
            </section>

            {/* 5. 기능/특징 섹션 */}
            <section>
                <FeaturesSection />
            </section>

            {/* 6. 서비스 플로우 섹션 */}
            <section>
                <ServiceFlow />
            </section>

            {/* 7. 예시 리포트 섹션 (Header의 '예시 리포트' 스크롤 타겟) */}
            <section id="example-report">
                <ReportCards />
                {/* 예시 리포트 실제 보기 버튼은 이쪽에서 콜백 호출 */}
                <div className="max-w-[1200px] mx-auto px-6 mt-8 mb-16 flex justify-center">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onExampleReportClick}
                        className="px-8"
                    >
                        예시 리포트 열어보기
                    </Button>
                </div>
            </section>

            {/* 8. 운영/문의 정보 + CTA (Header의 '문의하기' 스크롤 타겟) */}
            <section id="contact">
                <OperationInfo />
                {/* RequestForm 페이지로 넘어가는 실제 CTA */}
                <div className="max-w-[1200px] mx-auto px-6 mt-8 mb-20 flex flex-col items-center gap-4">
                    <p className="text-sm text-gray-500">
                        웹 양식을 통해 분석 의뢰를 보내고 싶다면 아래 버튼을 눌러주세요.
                    </p>
                    <Button
                        size="lg"
                        onClick={onRequestClick}
                        className="px-10"
                    >
                        의뢰서 작성하러 가기
                    </Button>
                    {/* 필요하면 별도의 문의 콜백도 유지 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onContactClick}
                    >
                        다른 문의 방법이 필요하신가요?
                    </Button>
                </div>
            </section>
        </main>
    );
}
