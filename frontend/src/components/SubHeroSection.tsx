export function SubHeroSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[900px] mx-auto text-center">
          {/* Main Heading - 3x larger */}
          <h2 className="mb-12" style={{ color: '#000', fontSize: '38px', fontWeight: 700 }}>
            뷰티 데이터, <span style={{ color: '#61BFAD' }}>BEAUTIQ</span>와 함께 분석해 보세요
          </h2>

          {/* Body Text - Regular size (16px default) */}
          <div className="space-y-6">
            <p>
              지금까지 <span style={{ color: '#61BFAD', fontWeight: 700 }}>감</span>으로만 브랜드 콘셉트를 결정해 오지 않으셨나요?
            </p>

            <p>
              실사용자 리뷰부터{' '}
              <span style={{ color: '#61BFAD', fontWeight: 700 }}>팬덤 반응·콘텐츠 톤·시장 트렌드</span>
              까지<br />
              <span style={{ color: '#61BFAD', fontWeight: 700 }}>브랜드 성공</span>에 필요한 인사이트를 AI 분석 파이프라인으로 발견해 드립니다.
            </p>

            <p>
              전문적인 데이터 기반{' '}
              <span style={{ color: '#61BFAD', fontWeight: 700 }}>브랜드 전략·BEAUTIQ 리포트</span>
              를 가장 빠르게 받아보세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}