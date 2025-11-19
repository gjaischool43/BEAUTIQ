export function ServiceIntro() {
  const services = [
    {
      title: '데이터 기반 브랜드 전략 자동 생성',
      description: '스킨케어 10만+ 데이터 · 리뷰 패턴 · SNS 반응을 기반으로 크리에이터에게\n가장 잘 맞는 브랜드 전략을 \'근거 중심\'으로 제공합니다.'
    },
    {
      title: 'AI 분석 파이프라인',
      description: '콘텐츠·댓글·톤·연령·반응까지\n다층 분석하여 어떤 콘셉트가\n\'실제로 팔릴지\'를\nAI가 정량적으로 예측합니다.'
    },
    {
      title: '웹페이지에서 결과 확인',
      description: '신청만 하면, 분석 완료 시점에\n전략 보고서를 웹에서 즉시 열람할 수 있습니다.'
    }
  ];

  return (
    <section id="service-intro" className="py-24 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 
          className="tracking-widest mb-16 text-center"
          style={{ fontWeight: 700, fontSize: '36px', color: '#000000' }}
        >
          01. 서비스 소개
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-white rounded-3xl p-8 hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col items-center text-center"
            >
              <h3 
                className="mb-4"
                style={{ fontWeight: 600, fontSize: '18px', color: '#F06A98', whiteSpace: 'nowrap' }}
              >
                {service.title}
              </h3>
              <p 
                className="text-gray-600 leading-relaxed whitespace-pre-line"
                style={{ fontWeight: 300, fontSize: '16px', lineHeight: 1.7 }}
              >
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}