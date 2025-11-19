export function OperationInfo() {
  const points = [
    '웹에서는 신청/문의만 받는 구조로 운영',
    '최종 리포트는 모두 이메일로 발송',
    '디자이너/개발 리소스 최소로 운영 가능',
    '향후 자동화 될 주문형 대시보드 구조 고려 가능'
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 
          className="tracking-widest text-black mb-16"
          style={{ fontWeight: 400, fontSize: '16px' }}
        >
          04. 서비스 운영 방식
        </h2>
        
        <div className="max-w-[700px]">
          <ul className="space-y-4">
            {points.map((point, index) => (
              <li 
                key={index}
                className="text-gray-700 flex items-start gap-3"
                style={{ fontWeight: 300 }}
              >
                <span className="text-gray-400 mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}