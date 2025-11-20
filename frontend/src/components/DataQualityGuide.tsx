import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "./ui/accordion";


export function DataQualityGuide() {
    return (
        <Accordion type="single" collapsible className="mb-8">
            <AccordionItem value="guide">
                <AccordionTrigger className="text-base font-semibold">
                    YouTube 크리에이터 분석 데이터 품질 기준 안내
                </AccordionTrigger>

                <AccordionContent className="text-sm leading-relaxed text-muted-foreground space-y-6">

                    {/* 1. 필수 기준 */}
                    <section className="space-y-2">
                        <h3 className="font-semibold text-base">1. 필수 기준 (분석 가능 여부 결정)</h3>
                        <div>
                            <h4 className="font-medium">최소 영상 수</h4>
                            <ul className="list-disc ml-5 space-y-1">
                                <li>최근 6개월 업로드 영상 10개 이상</li>
                                <li>통계적 신뢰도 확보 위한 최소 샘플 수</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium">최소 댓글 수</h4>
                            <ul className="list-disc ml-5 space-y-1">
                                <li>전체 댓글 300개 이상</li>
                                <li>Demand/Problem 분석의 최소 기준</li>
                            </ul>
                        </div>
                    </section>

                    {/* 2. 권장 기준 */}
                    <section className="space-y-2">
                        <h3 className="font-semibold text-base">2. 권장 기준 (고신뢰도 분석)</h3>
                        <ul className="list-disc ml-5 space-y-1">
                            <li>영상 15~20개 이상</li>
                            <li>전체 댓글 500~1000개 이상</li>
                            <li>영상당 평균 댓글 10개 이상</li>
                            <li>포맷별 영상 최소 5개 이상 (How-to, Review 등)</li>
                            <li>최소 8주 이상의 업로드 히스토리</li>
                        </ul>
                    </section>

                    {/* 3. 지표별 요구사항 요약 */}
                    <section>
                        <h3 className="font-semibold text-base mb-2">3. 지표별 요구사항 요약</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2 pr-2 text-left font-medium">지표</th>
                                        <th className="py-2 pr-2 text-left font-medium">필수 기준</th>
                                        <th className="py-2 pr-2 text-left font-medium">권장 기준</th>
                                        <th className="py-2 text-left font-medium">신뢰도</th>
                                    </tr>
                                </thead>
                                <tbody className="align-top">
                                    <tr className="border-b">
                                        <td className="py-2 pr-2">Engagement</td>
                                        <td className="py-2 pr-2">영상 10개</td>
                                        <td className="py-2 pr-2">15개 이상</td>
                                        <td className="py-2">높음</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 pr-2">Demand</td>
                                        <td className="py-2 pr-2">댓글 300개</td>
                                        <td className="py-2 pr-2">1000개 이상</td>
                                        <td className="py-2">중간→높음</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-2">Format Fit</td>
                                        <td className="py-2 pr-2">포맷별 5개</td>
                                        <td className="py-2 pr-2">10개 이상</td>
                                        <td className="py-2">낮음→높음</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 4. 체크리스트 */}
                    <section className="space-y-2">
                        <h3 className="font-semibold text-base">4. 의뢰 전 체크리스트</h3>
                        <ul className="list-disc ml-5 space-y-1">
                            <li>최근 6개월 이내 영상 10개 이상인가요?</li>
                            <li>댓글 기능이 활성화된 영상이 대부분인가요?</li>
                            <li>영상당 평균 10개 이상 댓글이 있나요?</li>
                            <li>월 1회 이상 업로드가 유지되나요?</li>
                            <li>별도 포맷 분석이 필요하면 해당 포맷 영상이 5개 이상인가요?</li>
                        </ul>
                    </section>

                    <p className="text-xs text-muted-foreground">
                        기준을 모두 충족하지 않아도 분석은 가능합니다.
                        다만 보고서 내 &quot;데이터 품질&quot; 섹션에서 신뢰도를 함께 안내드리니 참고해 주세요.
                    </p>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}