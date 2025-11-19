import { Database, Sparkles, FileBarChart, Globe } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const features = [
  {
    title: "어떤 데이터를 분석하나요?",
    subtitle: "다층·입체적 분석 구조",
    description: [
      "BEAUTIQ는 단일 채널의 표면적 텍스트 분석이 아닌,",
      "10만+ 스킨케어 리뷰 / SNS 팬덤 반응 / 채널 메트릭·콘텐츠 톤 / 화장품 성분 데이터를 결합한 정량 기반 통합 분석을 수행합니다.",
      "→ 시장·팬덤·콘텐츠·제품 데이터를 모두 연결해 해석하는 뷰티 특화 AI 분석"
    ],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc2MzQ5OTMzM3ww&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    title: "어떤 방식으로 분석하나요?",
    subtitle: "AI 분석 파이프라인",
    description: [
      "텍스트·콘텐츠·시청자 반응·제품 평가까지 교차 분석하여",
      "'실제로 팔릴 콘셉트'를 정량적으로 예측합니다.",
      "BERT 감성 분석 / 임베딩 기반 맥락 분석 / 리뷰 패턴·문제점 탐색 / 팬덤 언어 패턴 분석 / 시장 트렌드 자동 추출"
    ],
    image: "https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjM0NzUzOTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    title: "어떤 결과를 제공하나요?",
    subtitle: "End-to-End 전략 제안",
    description: [
      "카테고리 적합도 분석 / 반응 패턴 & 포지셔닝 / 타깃 메시지 / 성분 기반 제품 아이디어 / BM 초안 제안",
      "→ 분석 → 인사이트 → BM 전략까지 이어지는 자동화 보고서 제공"
    ],
    image: "https://images.unsplash.com/photo-1758691736542-c437fea2c673?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHN0cmF0ZWd5JTIwcmVwb3J0fGVufDF8fHx8MTc2MzUxNTcwNnww&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    title: "어디에서 확인할 수 있나요?",
    subtitle: "웹 기반 보고서 열람",
    description: [
      "분석 완료 시, 웹에서 즉시 전략 보고서를 열람할 수 있습니다.",
      "장표 형태의 리포트 / creator–data–BM 3단 구조 / 시각화 기반 분석 결과 / 콘셉트별 추천 포지셔닝"
    ],
    image: "https://images.unsplash.com/photo-1762330914934-976533b1df84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBicm93c2VyJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc2MzUxNTcwNnww&ixlib=rb-4.1.0&q=80&w=1080"
  }
];

export function FeaturesSection() {
  return (
    <section className="py-24" style={{ backgroundColor: '#FDFBF4' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Title */}
        <h2 className="text-center mb-16" style={{ fontSize: '36px', fontWeight: 700, color: '#61BFAD' }}>
          뷰티 데이터 분석
        </h2>
        
        <div className="space-y-24">
          {features.map((feature, index) => {
            return (
              <div 
                key={index}
                className="flex flex-col lg:flex-row gap-12 items-center"
              >
                {/* Image Section */}
                <div className="flex-1 w-full">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white p-4">
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-100">
                      <ImageWithFallback
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 w-full space-y-6">
                  {/* Title */}
                  <h3 style={{ color: '#61BFAD', fontSize: '24px', fontWeight: 700 }}>
                    {feature.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="opacity-70">
                    {feature.subtitle}
                  </p>

                  {/* Description */}
                  <div className="space-y-4 leading-relaxed">
                    {feature.description.map((line, lineIndex) => (
                      <p key={lineIndex} className="text-gray-700">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}