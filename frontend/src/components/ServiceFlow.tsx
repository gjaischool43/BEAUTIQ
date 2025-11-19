import img1 from "../assets/5e64ac54970b54264317f5614ed2a9df6b52ecd1.png";
import img2 from "../assets/c54e7b56684a8e904da8c02b1a20474dda6dc6d5.png";
import img3 from "../assets/3083ec7c868657bb6e59c9d38b53ce1f0daf2444.png";
import img4 from "../assets/610e9f3d443d89ff8b2a8a9497a041a760869c47.png";


export function ServiceFlow() {
  const cards = [
    {
      title: '데이터 전처리',
      image: img1
    },
    {
      title: '감성·패턴 분석',
      image: img2
    },
    {
      title: '데이터 시각화',
      image: img3
    },
    {
      title: 'AI 분석',
      image: img4
    }
  ];

  return (
    <section id="service-intro" className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2
          className="tracking-widest mb-16 text-center"
          style={{ fontWeight: 700, fontSize: '36px', color: '#000000' }}
        >
          BEAUTIQ INSIGHTS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((card, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              {/* Image */}
              <div className="w-32 h-32 mb-6 rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center p-4">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Title */}
              <h3 className="text-gray-700" style={{ fontSize: '16px', fontWeight: 300 }}>
                {card.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}