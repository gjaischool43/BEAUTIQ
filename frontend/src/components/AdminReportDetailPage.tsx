// src/components/AdminReportDetailPage.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"; // shadcn 탭 컴포넌트

interface AdminReportDetailPageProps {
    reportId: number;
    onBack: () => void;
}

// 백엔드 응답 형태에 맞게 html 필드 추가
interface ReportDetail {
    report_id: number;
    request_id: number;
    title?: string | null;
    html?: string | null;      // 🔹 BM 섹션 HTML
    contents?: any;            // 🔹 혹시 기존 JSON이 같이 올 수도 있으니 optional 로 남김
    is_exported: boolean;
}

// creator_report_to_dict 결과와 맞춰서 타입 정의
interface CreatorReport {
    report_creator_id: number;
    title: string | null;
    platform: string | null;
    channel_url: string | null;
    channel_handle: string | null;
    blc_score: number | null;
    blc_grade: string | null;
    blc_grade_label: string | null;
    blc_tier: string | null;
    subscriber_count: number | null;
    engagement_score: number | null;
    views_score: number | null;
    demand_score: number | null;
    problem_score: number | null;
    format_score: number | null;
    consistency_score: number | null;
    meta: any;
    executive_summary: any;
    deep_analysis: any;
    blc_matching: any;
    risk_mitigation: any;
    created_at: string;
}

export function AdminReportDetailPage({ reportId, onBack }: AdminReportDetailPageProps) {
    const [report, setReport] = useState<ReportDetail | null>(null);
    const [creatorReport, setCreatorReport] = useState<CreatorReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [creatorLoading, setCreatorLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                // 1) BM 보고서 조회
                const resp = await fetch(`${API_BASE}/admin/report/${reportId}`);
                if (!resp.ok) {
                    throw new Error(`보고서 조회 실패 (status ${resp.status})`);
                }
                const data = (await resp.json()) as ReportDetail;
                setReport(data);

                // 2) 크리에이터 분석 보고서 조회 (request_id 기준)
                if (data.request_id) {
                    setCreatorLoading(true);
                    try {
                        const respCreator = await fetch(`${API_BASE}/admin/requests/${data.request_id}/creator-report`);
                        if (respCreator.ok) {
                            const cdata = await respCreator.json() as {
                                exists: boolean;
                                report: CreatorReport | null;
                            };
                            if (cdata.exists && cdata.report) {
                                setCreatorReport(cdata.report);
                            } else {
                                setCreatorReport(null);
                            }
                        } else if (respCreator.status === 404) {
                            // 생성 안 된 경우
                            setCreatorReport(null);
                        }
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setCreatorLoading(false);
                    }
                }
            } catch (err: any) {
                toast.error(err.message || "보고서를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [API_BASE, reportId]);

    const handleExport = async () => {
        if (!report) return;
        setExporting(true);
        try {
            const resp = await fetch(`${API_BASE}/admin/report/${report.report_id}/export`, {
                method: "POST",
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => null);
                throw new Error(err?.detail || `내보내기 실패 (status ${resp.status})`);
            }
            const data = (await resp.json()) as { report_id: number; is_exported: boolean };
            setReport(prev => (prev ? { ...prev, is_exported: data.is_exported } : prev));
            toast.success("내보내기가 완료되었습니다. 이제 의뢰 조회에서 리포트를 볼 수 있습니다.");
        } catch (err: any) {
            toast.error(err.message || "내보내기 중 오류가 발생했습니다.");
        } finally {
            setExporting(false);
        }
    };

    if (loading || !report) {
        return (
            <div className="min-h-screen bg-muted/20 pt-24 pb-12">
                <div className="w-full max-w-4xl mx-auto px-6">
                    <Button variant="ghost" onClick={onBack} className="mb-6">
                        의뢰 목록으로
                    </Button>
                    <div>불러오는 중...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 pt-24 pb-12">
            <div className="w-full max-w-4xl mx-auto px-6">
                <Button variant="ghost" onClick={onBack} className="mb-6">
                    의뢰 목록으로
                </Button>

                <Card>
                    <CardHeader className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle>{report.title || "BM 보고서"}</CardTitle>
                            <CardDescription>
                                Request ID: {report.request_id}
                            </CardDescription>
                        </div>
                        <Button
                            variant={report.is_exported ? "outline" : "default"}
                            onClick={handleExport}
                            disabled={exporting || report.is_exported}
                        >
                            {report.is_exported ? "내보내기 완료" : exporting ? "내보내기 중..." : "내보내기"}
                        </Button>
                    </CardHeader>

                    <CardContent className="overflow-hidden">
                        <Tabs defaultValue="bm" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="bm">브랜드 BM 보고서</TabsTrigger>
                                <TabsTrigger value="creator">크리에이터 분석 보고서</TabsTrigger>
                            </TabsList>

                            {/* BM 탭 */}
                            <TabsContent value="bm">
                                {report.html ? (
                                    <div
                                        className="bm-report prose max-w-none text-sm md:text-base leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: report.html || "" }}
                                    />
                                ) : (
                                    <pre className="text-xs bg-muted/60 p-4 rounded-md overflow-x-auto">
                                        {JSON.stringify(report.contents, null, 2)}
                                    </pre>
                                )}
                            </TabsContent>

                            {/* 크리에이터 분석 탭 */}
                            <TabsContent value="creator">
                                {creatorLoading ? (
                                    <div>크리에이터 분석 보고서를 불러오는 중...</div>
                                ) : (
                                    <CreatorReportView report={creatorReport} />
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// 크리에이터 분석 뷰 컴포넌트
// ─────────────────────────────────────────────

function CreatorReportView({ report }: { report: CreatorReport | null }) {
    if (!report) {
        return <div>크리에이터 분석 보고서가 아직 생성되지 않았습니다.</div>;
    }

    // content_md 추출 헬퍼 함수
    const getContentMd = (section: any): string => {
        if (!section) return "";
        if (typeof section === "string") return section;
        if (section.content_md) return section.content_md;
        // content_md가 없으면 JSON을 텍스트로 변환
        return JSON.stringify(section, null, 2);
    };

    return (
        <div className="space-y-6">
            {/* 헤더 요약 */}
            <section className="border rounded-xl p-4 bg-white shadow-sm">
                <h2 className="text-lg font-semibold mb-1">
                    {report.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                    BLC 점수 {report.blc_score ?? "-"} / 100 · 등급 {report.blc_grade ?? "-"}
                    {report.blc_grade_label ? ` (${report.blc_grade_label})` : ""} · {report.blc_tier ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    구독자 {report.subscriber_count != null ? report.subscriber_count.toLocaleString() : "-"}명
                </p>
            </section>

            {/* 1. 한 장 요약 */}
            <section className="border rounded-xl p-4 bg-white shadow-sm overflow-hidden">
                <h3 className="text-base font-semibold mb-2">1. 한 장 요약</h3>
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {getContentMd(report.executive_summary)}
                </div>
            </section>

            {/* 2. 채널 심층 분석 */}
            <section className="border rounded-xl p-4 bg-white shadow-sm overflow-hidden">
                <h3 className="text-base font-semibold mb-2">2. 채널 심층 분석</h3>
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {getContentMd(report.deep_analysis)}
                </div>
            </section>

            {/* 3. BLC 매칭 */}
            <section className="border rounded-xl p-4 bg-white shadow-sm overflow-hidden">
                <h3 className="text-base font-semibold mb-2">3. BLC 매칭</h3>
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {getContentMd(report.blc_matching)}
                </div>
            </section>

            {/* 4. 리스크 & 대응 */}
            <section className="border rounded-xl p-4 bg-white shadow-sm overflow-hidden">
                <h3 className="text-base font-semibold mb-2">4. 리스크 & 대응</h3>
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {getContentMd(report.risk_mitigation)}
                </div>
            </section>
        </div>
    );
}
