// src/components/HomePage.tsx
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Sparkles, Target, Database, TrendingUp, Layers, RefreshCw, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface HomePageProps {
    onRequestClick: () => void;
    onExampleReportClick: () => void;
    onContactClick: () => void;
}

export function HomePage({ onRequestClick,
    onExampleReportClick,
    onContactClick, }: HomePageProps) {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-pink-50/20">
                <div className="container mx-auto px-6 py-24 md:py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100/50 text-pink-700 mb-6">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm">AI 기반 브랜드 분석</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl mb-6 text-primary">
                                인플루언서를 위한<br />맞춤형 브랜드 론칭 전략
                            </h1>
                            <p className="text-xl text-muted-foreground mb-8">
                                감성 분석 + 리뷰 분석 + 콘셉트 제안까지 한 번에
                            </p>
                            <Button
                                onClick={onRequestClick}
                                size="lg"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6"
                            >
                                의뢰서 작성하기
                            </Button>


                        </div>
                        <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                            <ImageWithFallback
                                src="https://images.unsplash.com/photo-1622782914767-404fb9ab3f57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080"
                                alt="Social Media Analytics"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Service Introduction Section */}
            <section id="service" className="py-24 bg-background">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl mb-4">우리 서비스, 무엇이 다를까요?</h2>
                        <p className="text-muted-foreground text-lg">기존 리서치 대비 차별점을 확인하세요</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        {/* 기존 대비 */}
                        <Card className="border-2 border-border">
                            <CardContent className="p-8">
                                <h3 className="mb-6 text-destructive">기존 리서치의 한계</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-destructive">•</span>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">일반적인 시장 통계만 제공</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-destructive">•</span>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">콘텐츠/문장단위 인사이트 부족</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-destructive">•</span>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">추상적인 리포트 중심</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-destructive">•</span>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">브랜드 방향 제시가 모호함</p>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* 우리 서비스 */}
                        <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50/30 to-background">
                            <CardContent className="p-8">
                                <h3 className="mb-6 text-pink-700">우리 서비스의 차별점</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Target className="w-4 h-4 text-pink-700" />
                                        </div>
                                        <div>
                                            <h4 className="mb-1">데이터 기반 페르소나 분석</h4>
                                            <p className="text-muted-foreground">콘텐츠/리뷰의 감성·문맥 패턴을 정밀 분석</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Database className="w-4 h-4 text-pink-700" />
                                        </div>
                                        <div>
                                            <h4 className="mb-1">커머스 리뷰 + SNS 교차분석</h4>
                                            <p className="text-muted-foreground">다양한 채널의 신호를 통합 비교</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Layers className="w-4 h-4 text-pink-700" />
                                        </div>
                                        <div>
                                            <h4 className="mb-1">콘셉트 도출 + 브랜드 방향</h4>
                                            <p className="text-muted-foreground">실행 가능한 전략 제안</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-1">
                                            <RefreshCw className="w-4 h-4 text-pink-700" />
                                        </div>
                                        <div>
                                            <h4 className="mb-1">교차 검증 + 피드백 루프</h4>
                                            <p className="text-muted-foreground">지표 기반 개선/최적화</p>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Examples Section */}
            <section id="examples" className="py-24 bg-muted/20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl mb-4">분석에서 브랜드까지, 실제 BM 보고서 예시</h2>
                        <p className="text-muted-foreground text-lg">데이터 기반 전략과 산출물을 확인하세요</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 relative overflow-hidden">
                                <ImageWithFallback
                                    src="https://images.unsplash.com/photo-1710244182004-1c708b3f146d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080"
                                    alt="Data Visualization"
                                    className="w-full h-full object-cover opacity-60"
                                />
                            </div>
                            <CardContent className="p-6">
                                <h3 className="mb-2">감성 분석 기반 톤&무드 제안</h3>
                                <p className="text-muted-foreground mb-4">
                                    감성·키워드 패턴 분석으로 브랜드 톤&무드 정의
                                </p>
                                <div className="flex items-center gap-2 text-pink-700">
                                    <span>자세히 보기</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-gradient-to-br from-blue-100 to-cyan-100 relative overflow-hidden">
                                <ImageWithFallback
                                    src="https://images.unsplash.com/photo-1688953228417-8ec4007eb532?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080"
                                    alt="Beauty Products"
                                    className="w-full h-full object-cover opacity-60"
                                />
                            </div>
                            <CardContent className="p-6">
                                <h3 className="mb-2">리뷰 데이터 기반 제품 콘셉트</h3>
                                <p className="text-muted-foreground mb-4">
                                    실제 사용 리뷰를 분석해 최적 제품 콘셉트 도출
                                </p>
                                <div className="flex items-center gap-2 text-pink-700">
                                    <span>자세히 보기</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
                                <div className="w-full h-full flex items-center justify-center">
                                    <TrendingUp className="w-16 h-16 text-purple-300" />
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <h3 className="mb-2">브랜드 론칭 방향 리포트</h3>
                                <p className="text-muted-foreground mb-4">
                                    시장 진입 전략부터 메시지/컨셉 방향까지 종합 가이드
                                </p>
                                <div className="flex items-center gap-2 text-pink-700">
                                    <span>자세히 보기</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="contact" className="py-24 bg-gradient-to-br from-pink-600 to-purple-600 text-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl mb-4">지금 바로 시작해보세요</h2>
                    <p className="text-xl mb-8 text-pink-100">전문가가 직접 분석한 맞춤형 BM 보고서를 받아보세요</p>
                    <Button onClick={onRequestClick} size="lg" className="bg-white text-pink-700 hover:bg-pink-50 px-8 py-6">
                        의뢰서 작성하기
                    </Button>
                </div>
            </section>
        </div>
    );
}


