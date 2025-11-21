// src/components/RequestLookupPage.tsx
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

interface RequestLookupPageProps {
    onBack: () => void;
}

// 백엔드에서 내려줄 리포트 타입
// - html: 백엔드에서 sections만 HTML로 변환한 문자열
// - contents: 혹시 아직 JSON 그대로 오는 경우를 대비해서 optional로 남겨둠 (백엔드 정리되면 제거해도 됨)
interface LookupReport {
    report_id: number;
    request_id: number;
    title?: string | null;
    html?: string | null;
    contents?: any;
}

// 크리에이터 분석 보고서 타입
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

export function RequestLookupPage({ onBack }: RequestLookupPageProps) {
    const [email, setEmail] = useState("");
    const [viewPw, setViewPw] = useState("");
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<LookupReport | null>(null);
    const [creatorReport, setCreatorReport] = useState<CreatorReport | null>(null);
    const [creatorLoading, setCreatorLoading] = useState(false);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setReport(null);

        if (!email || !viewPw) {
            toast.error("이메일과 열람 비밀번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const resp = await fetch(`${API_BASE}/request/lookup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, view_pw: viewPw }),
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => null);
                throw new Error(err?.detail || `요청 실패 (status ${resp.status})`);
            }

            const data = (await resp.json()) as {
                available: boolean;
                message: string;
                report?: LookupReport | null;
            };

            if (!data.available) {
                toast.info(data.message || "리포트가 준비중입니다.");
                onBack();
                return;
            }

            const fetchedReport = data.report ?? null;
            setReport(fetchedReport);

            // 크리에이터 분석 보고서도 함께 조회
            if (fetchedReport?.request_id) {
                setCreatorLoading(true);
                try {
                    const respCreator = await fetch(`${API_BASE}/admin/requests/${fetchedReport.request_id}/creator-report`);
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
                        setCreatorReport(null);
                    }
                } catch (err) {
                    console.error("크리에이터 분석 보고서 조회 실패:", err);
                    setCreatorReport(null);
                } finally {
                    setCreatorLoading(false);
                }
            }

            toast.success("리포트를 불러왔습니다.");
        } catch (err: any) {
            toast.error(err.message || "서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="w-full max-w-3xl mx-auto px-6">
                <Button variant="ghost" onClick={onBack} className="mb-6">
                    메인으로
                </Button>

                {!report && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>의뢰 조회</CardTitle>
                            <CardDescription>
                                의뢰 시 입력하신 이메일과 열람 비밀번호로 BM 보고서를 조회할 수 있습니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">이메일</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@email.com"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="viewPw">열람 비밀번호</Label>
                                    <Input
                                        id="viewPw"
                                        type="password"
                                        value={viewPw}
                                        onChange={(e) => setViewPw(e.target.value)}
                                        placeholder="의뢰 시 입력한 비밀번호"
                                        disabled={loading}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "조회 중..." : "조회하기"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {report && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{report.title || "BM 보고서"}</CardTitle>
                            <CardDescription>요약된 BM 리포트 내용입니다.</CardDescription>
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
                                        <pre className="text-xs bg-muted/60 p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
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
                )}
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


