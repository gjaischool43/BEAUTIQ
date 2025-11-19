export function DifferentiationSection() {
  const differentiators = [
    {
      title: '분석 초점',
      icon: '🎯',
      competitor: '댓글·게시물 등 표면적인 텍스트 중심 분석',
      ours: '팬덤의 실제 반응 + 크리에이터 채널 특성 + 시장 데이터까지\n다층적으로 결합한 정량 기반 \'니즈 통합 분석\''
    },
    {
      title: '데이터 범위',
      icon: '📊',
      competitor: '유튜브 댓글 등 단일 채널 중심 분석',
      ours: '10만+ 스킨케어 리뷰\nSNS 댓글·팬덤 언어 패턴\n채널 메트릭 + 화장품 성분 데이터'
    },
    {
      title: '분석 강도·정확도',
      icon: '🔍',
      competitor: '키워드 중심의 표면적인 분석',
      ours: '리뷰 맥락·감성·자주 등장하는 문제점·제품 이미지 톤·팬덤 언어 패턴까지\n깊이 파고드는 정량 기반 실사용자 분석을 제공합니다.'
    },
    {
      title: '분석 기능 (데이터)',
      icon: '💡',
      competitor: '단순 시각화 및 요약 제공',
      ours: '카테고리 적합도 분석\n콘셉트별 반응 패턴 분석\n성분 기반 제품 아이디어 추천'
    },
    {
      title: '분석 기능 (통합)',
      icon: '🔗',
      competitor: '개별 지표 중심의 단편적 분석',
      ours: '영상·댓글 기반 이미지 톤 식별\n시장·팬덤 데이터 교차 분석\n→ 분석 결과가 바로 브랜드 콘셉트와 제품 방향성으로 이어집니다.'
    },
    {
      title: '결과 활용',
      icon: '✨',
      competitor: '분석 결과 제공에 그침',
      ours: '분석 → 콘셉트 제안 → 제품 방향성 추천(BM 초안)까지 이어지는\nEnd-to-End 자동화 보고서를 제공합니다.'
    }
  ];

  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 
          className="tracking-widest mb-16 text-center"
          style={{ fontWeight: 700, fontSize: '36px', color: '#000000' }}
        >
          BEAUTIQ의 차별성
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {differentiators.map((item, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-3xl p-8 hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col"
            >
              <h3 
                className="text-center mb-6 pb-3 border-b border-gray-200"
                style={{ fontWeight: 600, fontSize: '18px', color: '#F06A98' }}
              >
                {item.title}
              </h3>
              
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="bg-white rounded-2xl p-4 flex-1 flex flex-col">
                  <div 
                    className="text-gray-500 mb-2"
                    style={{ fontWeight: 300, fontSize: '14px' }}
                  >
                    상대 서비스
                  </div>
                  <p 
                    className="text-gray-700 whitespace-pre-line"
                    style={{ fontWeight: 300, lineHeight: 1.7, fontSize: '16px' }}
                  >
                    {item.competitor}
                  </p>
                </div>
                
                <div className="bg-white rounded-2xl p-4 border-2 flex-1 flex flex-col" style={{ borderColor: '#000000' }}>
                  <div 
                    className="mb-2"
                    style={{ fontWeight: 600, fontSize: '14px', color: '#000000' }}
                  >
                    우리 서비스
                  </div>
                  <p 
                    className="text-black whitespace-pre-line"
                    style={{ fontWeight: 400, lineHeight: 1.7, fontSize: '16px' }}
                  >
                    {item.ours}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}