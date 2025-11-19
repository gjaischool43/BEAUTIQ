
import heroImage from "../assets/fd47941e6b03758f16890143375d118273271944.png"
interface HeroSectionProps {
  onRequestClick: () => void;
}

export function HeroSection({ onRequestClick }: HeroSectionProps) {
  return (
    <section className="relative pt-16 h-screen min-h-[600px] flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="BEAUTIQ Background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <h1
            className="text-5xl md:text-6xl mb-6 tracking-tight"
            style={{ fontWeight: 700, lineHeight: 1.2, color: '#FFFFFF' }}
          >
            AI 기반 뷰티 크리에이터
            <br />
            브랜드 컨설팅 플랫폼
          </h1>

          <p
            className="text-lg md:text-xl mb-12 leading-relaxed"
            style={{ fontWeight: 700, color: '#FFFFFF' }}
          >
            크리에이터의 감각을 데이터 기반 브랜드 전략과 BM 리포트로 구체화합니다.
          </p>

          <div className="flex items-center justify-center">
            <button
              onClick={onRequestClick}
              className="px-8 py-3 bg-white text-black hover:bg-gray-100 transition-all text-sm tracking-wide"
              style={{ fontWeight: 400 }}
            >
              문의하기
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}