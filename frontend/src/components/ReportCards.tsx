export function ReportCards() {
  const cards = [
    {
      id: 1,
      title: "분석 결과 요약",
      subtitle: "****** **",
      content: (
        <div className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
              <svg className="w-16 h-16" fill="none" stroke="#2D2D2D" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          </div>
          <div className="bg-white/70 rounded-3xl p-6 space-y-4">
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: '#666' }}>BLC 점수</p>
              <p className="text-4xl mb-4" style={{ fontWeight: 700, color: '#2D2D2D' }}>77.3<span className="text-2xl">/100</span></p>
            </div>
            <div className="flex justify-between items-center py-3 border-t" style={{ borderColor: '#E5E5E5' }}>
              <span style={{ color: '#666' }}>등급</span>
              <span style={{ fontWeight: 700, color: '#2D2D2D', fontSize: '20px' }}>A (Go)</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#666' }}>Tier</span>
              <span style={{ fontWeight: 600, color: '#2D2D2D' }}>Tier_2_Mid</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "핵심 강점",
      subtitle: "3가지 완벽한 점수",
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-4 bg-white/70 rounded-3xl p-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
              <svg className="w-8 h-8" fill="none" stroke="#2D2D2D" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div className="flex-1">
              <p style={{ fontWeight: 700, color: '#2D2D2D', marginBottom: '4px' }}>Engagement</p>
              <p className="text-sm" style={{ color: '#666' }}>소비자와의 강한 상호작용</p>
              <p style={{ fontWeight: 700, color: '#2D2D2D', marginTop: '4px' }}>100.0/100</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/70 rounded-3xl p-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
              <svg className="w-8 h-8" fill="none" stroke="#2D2D2D" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1">
              <p style={{ fontWeight: 700, color: '#2D2D2D', marginBottom: '4px' }}>Problem</p>
              <p className="text-sm" style={{ color: '#666' }}>피부 고민 언급 비율 높음</p>
              <p style={{ fontWeight: 700, color: '#2D2D2D', marginTop: '4px' }}>100.0/100</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/70 rounded-3xl p-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
              <svg className="w-8 h-8" fill="none" stroke="#2D2D2D" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div className="flex-1">
              <p style={{ fontWeight: 700, color: '#2D2D2D', marginBottom: '4px' }}>Consistency</p>
              <p className="text-sm" style={{ color: '#666' }}>주 2.58회 안정적 업로드</p>
              <p style={{ fontWeight: 700, color: '#2D2D2D', marginTop: '4px' }}>100.0/100</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "개선 영역",
      subtitle: "집중 보완이 필요해요",
      content: (
        <div className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="188.4" transform="rotate(-90 50 50)"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#2D2D2D' }}>25%</span>
              </div>
            </div>
          </div>

          <div className="bg-white/70 rounded-3xl p-6 space-y-5">
            <div>
              <div className="flex justify-between mb-3">
                <span style={{ fontWeight: 700, color: '#2D2D2D' }}>Demand</span>
                <span style={{ fontWeight: 700, color: '#2D2D2D' }}>24.5/100</span>
              </div>
              <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '24.5%', background: '#2D2D2D' }}></div>
              </div>
              <p className="text-sm mt-2" style={{ color: '#666' }}>구매/사용 인증 댓글 부족</p>
            </div>

            <div>
              <div className="flex justify-between mb-3">
                <span style={{ fontWeight: 700, color: '#2D2D2D' }}>Format</span>
                <span style={{ fontWeight: 700, color: '#2D2D2D' }}>50.0/100</span>
              </div>
              <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '50%', background: '#2D2D2D' }}></div>
              </div>
              <p className="text-sm mt-2" style={{ color: '#666' }}>다양한 콘텐츠 포맷 필요</p>
            </div>
          </div>

          <div className="bg-white/50 rounded-3xl p-5 text-center">
            <p className="text-sm" style={{ color: '#666', lineHeight: '1.6' }}>
              Before/After, Review 등<br />
              다양한 형식을 도입해보세요
            </p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "타겟 오디언스",
      subtitle: "Demand + Problem 분석",
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.6)' }}>
                <svg className="w-12 h-12" fill="none" stroke="#2D2D2D" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <p className="text-sm mb-1" style={{ color: '#666' }}>Demand</p>
              <p style={{ fontWeight: 700, color: '#2D2D2D' }}>낮음 ↓</p>
            </div>

            <div className="text-4xl" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>+</div>

            <div className="text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.6)' }}>
                <svg className="w-12 h-12" fill="none" stroke="#2D2D2D" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm mb-1" style={{ color: '#666' }}>Problem</p>
              <p style={{ fontWeight: 700, color: '#2D2D2D' }}>높음 ↑</p>
            </div>
          </div>

          <div className="bg-white/70 rounded-3xl p-6 text-center">
            <p style={{ fontWeight: 700, color: '#2D2D2D', marginBottom: '12px', fontSize: '18px' }}>
              피부 고민은 많지만<br />제품 피드백은 소극적
            </p>
            <div className="h-px bg-white/50 my-4"></div>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-2xl">💡</span>
              <p className="text-sm text-left" style={{ color: '#666', lineHeight: '1.6' }}>
                신뢰할 수 있는 제품 리뷰와<br />
                사용 후기 중심 콘텐츠 강화 필요
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "브랜드 매칭",
      subtitle: "BLC 분석 결과",
      content: (
        <div className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
              <span style={{ fontSize: '48px', fontWeight: 700, color: '#2D2D2D' }}>A</span>
            </div>
          </div>

          <div className="bg-white/70 rounded-3xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                <svg className="w-5 h-5" fill="none" stroke="#2D2D2D" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: '#666' }}>적합 카테고리</p>
                <p style={{ fontWeight: 700, color: '#2D2D2D' }}>트렌드·큐레이터</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                <svg className="w-5 h-5" fill="none" stroke="#2D2D2D" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: '#666' }}>적합 이미지</p>
                <p style={{ fontWeight: 700, color: '#2D2D2D' }}>트렌디·혁신·인플루언서형</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                <svg className="w-5 h-5" fill="none" stroke="#2D2D2D" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: '#666' }}>적합 제품</p>
                <p style={{ fontWeight: 700, color: '#2D2D2D' }}>신제품·한정판·시즌 라인</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "리스크 & 대응",
      subtitle: "즉시 실행 가능한 솔루션",
      content: (
        <div className="space-y-4">
          <div className="bg-white/70 rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <div className="text-3xl">⚠️</div>
              <div className="flex-1">
                <p style={{ fontWeight: 700, color: '#2D2D2D', marginBottom: '8px' }}>구매 전환 부재</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm" style={{ color: '#666' }}>✓</span>
                    <p className="text-sm flex-1" style={{ color: '#666' }}>강력한 CTA 추가</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm" style={{ color: '#666' }}>✓</span>
                    <p className="text-sm flex-1" style={{ color: '#666' }}>제품 링크 명확히 표시</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm" style={{ color: '#666' }}>✓</span>
                    <p className="text-sm flex-1" style={{ color: '#666' }}>사용 후기 공유 유도</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/70 rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <div className="text-3xl">📊</div>
              <div className="flex-1">
                <p style={{ fontWeight: 700, color: '#2D2D2D', marginBottom: '8px' }}>시각적 증거 부족</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm" style={{ color: '#666' }}>✓</span>
                    <p className="text-sm flex-1" style={{ color: '#666' }}>Before/After 콘텐츠 제작</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm" style={{ color: '#666' }}>✓</span>
                    <p className="text-sm flex-1" style={{ color: '#666' }}>비주얼 스토리텔링 강화</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm" style={{ color: '#666' }}>✓</span>
                    <p className="text-sm flex-1" style={{ color: '#666' }}>단계별 사용 과정 공개</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/50 rounded-3xl p-4 text-center">
            <p className="text-sm" style={{ color: '#666' }}>
              데이터 기반 즉시 실행 가능한 액션 플랜
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="py-24" style={{ background: '#8AD6C8' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-6 py-2 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '14px', letterSpacing: '1px' }}>BEAUTIQ REPORT</span>
          </div>
          <h2 className="mb-4" style={{ color: 'white', fontWeight: 700, fontSize: '32px' }}>
            크리에이터 분석 리포트
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            AI가 분석한 채널 인사이트를 한눈에 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-3xl p-8 transition-transform hover:scale-[1.02]"
              style={{
                background: '#F9F7E8',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                width: '340px',
                height: '730px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Top Label */}
              <div className="flex justify-center mb-6">
                <div
                  className="rounded-full px-5 py-1.5"
                  style={{
                    background: '#61BFAD',
                    border: '1px solid #61BFAD'
                  }}
                >
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>
                    BEAUTIQ
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-6">
                <h3 style={{ color: '#2D2D2D', fontWeight: 700, fontSize: '26px', marginBottom: '8px' }}>
                  {card.title}
                </h3>
                <p style={{ color: '#555', fontSize: '17px' }}>
                  {card.subtitle}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-center overflow-y-auto">
                {card.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}