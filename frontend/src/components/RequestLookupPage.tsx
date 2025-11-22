// src/components/RequestLookupPage.tsx
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Cell, PieChart, Pie, BarChart, Bar, XAxis, YAxis,
    Tooltip, Legend, LineChart, Line, CartesianGrid
} from "recharts";
import { TrendingUp, Users, Eye, Star, Award, AlertCircle, PieChart as PieIcon, BarChart3 } from "lucide-react";

interface RequestLookupPageProps {
    onBack: () => void;
}

interface LookupReport {
    report_id: number;
    request_id: number;
    title?: string | null;
    html?: string | null;
    contents?: any;
}

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

interface MetricItem {
    label: string;
    value: string | number;
    unit?: string;
    percentage?: number;
}

interface BMSection {
    title: string;
    metrics?: MetricItem[];
    content?: string;
    type?: 'metrics' | 'text' | 'table';
}

interface BMReportData {
    title?: string;
    sections: BMSection[];
}

export function RequestLookupPage({ onBack }: RequestLookupPageProps) {
    const [email, setEmail] = useState("");
    const [viewPw, setViewPw] = useState("");
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<LookupReport | null>(null);
    const [creatorReport, setCreatorReport] = useState<CreatorReport | null>(null);
    const [creatorLoading, setCreatorLoading] = useState(false);
    const [bmData, setBmData] = useState<BMReportData | null>(null);

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

            // BM 리포트 파싱
            if (fetchedReport?.html) {
                const parsed = parseBMReport(fetchedReport.html);
                setBmData(parsed);
            }

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
            <div className="w-full max-w-4xl mx-auto px-6">
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
                                    {bmData ? (
                                        <BMReportView data={bmData} htmlContent={report.html ?? undefined} />
                                    ) : report.html ? (
                                        <div
                                            className="bm-report prose max-w-none text-base leading-relaxed"
                                            style={{
                                                '--tw-prose-body': '#374151',
                                                '--tw-prose-headings': '#111827',
                                                '--tw-prose-links': '#2563eb',
                                            } as React.CSSProperties}
                                            dangerouslySetInnerHTML={{ __html: report.html }}
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
// BM 리포트 파싱 함수
// ─────────────────────────────────────────────
function parseBMReport(html: string): BMReportData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const data: BMReportData = {
        sections: []
    };

    // 모든 섹션 추출
    const sections = doc.querySelectorAll('section, [class*="section"], article, main > div');

    sections.forEach((section) => {
        const title = section.querySelector('h1, h2, h3')?.textContent || '';

        // 테이블 추출
        const tables = section.querySelectorAll('table');
        tables.forEach((table) => {
            const metrics = parseTable(table);
            if (metrics.length > 0) {
                data.sections.push({
                    title: title || '분석 지표',
                    metrics,
                    type: 'metrics'
                });
            }
        });

        // 리스트 항목 추출 (ul, ol)
        const lists = section.querySelectorAll('ul > li, ol > li');
        if (lists.length > 0) {
            const items = Array.from(lists).slice(0, 10).map(li => {
                const text = li.textContent || '';
                const colonIndex = text.indexOf(':');
                return {
                    label: colonIndex > 0 ? text.substring(0, colonIndex).trim() : text.substring(0, 30),
                    value: colonIndex > 0 ? text.substring(colonIndex + 1).trim() : text
                };
            });
            if (items.length > 0) {
                data.sections.push({
                    title: title || '주요 항목',
                    metrics: items,
                    type: 'metrics'
                });
            }
        }

        // 일반 텍스트 섹션
        if (tables.length === 0 && lists.length === 0) {
            const textContent = section.textContent?.trim() || '';
            if (textContent.length > 50 && title) {
                data.sections.push({
                    title,
                    content: textContent,
                    type: 'text'
                });
            }
        }
    });

    return data;
}

function parseTable(table: Element): MetricItem[] {
    const rows = table.querySelectorAll('tbody tr, tr');
    const metrics: MetricItem[] = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
            const label = cells[0]?.textContent?.trim() || '';
            const valueText = cells[1]?.textContent?.trim() || '';

            // 숫자 추출
            const numberMatch = valueText.match(/(\d+(?:[.,]\d+)?)/);
            const number = numberMatch ? numberMatch[1].replace(',', '') : valueText;

            // 백분율 추출
            const percentMatch = valueText.match(/(\d+)%/);

            metrics.push({
                label,
                value: number,
                percentage: percentMatch ? parseInt(percentMatch[1]) : undefined
            });
        }
    });

    return metrics;
}

// ─────────────────────────────────────────────
// BM 리포트 뷰 컴포넌트
// ─────────────────────────────────────────────
function BMReportView({ data, htmlContent }: { data: BMReportData; htmlContent?: string }) {
    const metricsData = data.sections.filter(s => s.metrics && s.metrics.length > 0);
    const textSections = data.sections.filter(s => s.type === 'text');

    // 숫자 값으로 변환 가능한 메트릭스만 필터링
    const numericMetrics = metricsData.flatMap(section =>
        (section.metrics || []).filter(m => !isNaN(Number(m.value)))
    );

    // 차트용 데이터 생성
    const chartData = metricsData.slice(0, 2).map(section => {
        const metrics = (section.metrics || []).slice(0, 8);
        return {
            name: section.title,
            data: metrics.map(m => ({
                name: m.label.substring(0, 10),
                value: Number(m.value) || 0,
                fullLabel: m.label
            }))
        };
    });

    return (
        <div className="space-y-8">
            {/* 주요 지표 요약 카드 */}
            {numericMetrics.length > 0 && (
                <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {numericMetrics.slice(0, 10).map((metric, idx) => (
                        <MetricCard key={idx} metric={metric} index={idx} />
                    ))}
                </section>
            )}

            {/* 막대 차트 대시보드 */}
            {chartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {chartData.map((chart, idx) => (
                        <Card key={idx} className="shadow-lg border border-gray-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    {chart.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: '#6b7280', fontSize: 11 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                padding: '8px 12px'
                                            }}
                                            formatter={(value) => [`${value}`, '값']}
                                        />
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#3b82f6" animationDuration={800} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* 분포도 파이 차트 */}
            {metricsData.length > 0 && metricsData[0].metrics && metricsData[0].metrics.length > 0 && (
                <Card className="shadow-lg border border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PieIcon className="w-5 h-5 text-purple-600" />
                            {metricsData[0].title} - 분포도
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={(metricsData[0].metrics || []).slice(0, 8).map((m, i) => ({
                                        name: m.label.substring(0, 12),
                                        value: Number(m.value) || 0
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    dataKey="value"
                                    animationDuration={800}
                                >
                                    {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'].map((color, index) => (
                                        <Cell key={`cell-${index}`} fill={color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* 상세 메트릭 그리드 */}
            {metricsData.length > 0 && (
                <Card className="shadow-lg border border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-600" />
                            상세 분석 지표
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {metricsData.map((section, sIdx) => (
                                <div key={sIdx} className="border-l-4 border-gradient-to-b from-blue-500 to-purple-500 pl-4">
                                    <h4 className="font-bold text-gray-900 mb-4 text-base">{section.title}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(section.metrics || []).map((metric, mIdx) => {
                                            const isNumeric = !isNaN(Number(metric.value));
                                            return (
                                                <div
                                                    key={mIdx}
                                                    className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-200"
                                                >
                                                    <div className="text-xs text-gray-600 font-semibold mb-2 truncate">{metric.label}</div>
                                                    <div className="flex items-baseline gap-2 mb-3">
                                                        <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                                                        {metric.unit && <div className="text-sm text-gray-500">{metric.unit}</div>}
                                                    </div>
                                                    {metric.percentage !== undefined && isNumeric && (
                                                        <div className="w-full">
                                                            <div className="text-xs text-gray-600 mb-1 font-medium">{metric.percentage}%</div>
                                                            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 to-purple-500"
                                                                    style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 텍스트 섹션 */}
            {textSections.length > 0 && (
                <div className="space-y-4">
                    {textSections.map((section, idx) => (
                        <Card key={idx} className="shadow-lg border border-gray-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">{section.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-base leading-relaxed whitespace-pre-wrap break-words text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    {section.content}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* 원본 HTML 콘텐츠 (참고용) */}
            {htmlContent && (
                <Card className="shadow-lg border border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">상세 보고서 (원본)</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                        <div
                            className="bm-report prose prose-sm max-w-none text-sm leading-relaxed"
                            style={{
                                '--tw-prose-body': '#374151',
                                '--tw-prose-headings': '#111827',
                                '--tw-prose-links': '#2563eb',
                            } as React.CSSProperties}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// 메트릭 카드 컴포넌트
// ─────────────────────────────────────────────
function MetricCard({ metric, index }: { metric: MetricItem; index: number }) {
    const colors = [
        'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
        'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
        'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700',
        'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
        'from-pink-50 to-pink-100 border-pink-200 text-pink-700',
        'from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-700',
        'from-amber-50 to-amber-100 border-amber-200 text-amber-700',
        'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700',
        'from-red-50 to-red-100 border-red-200 text-red-700',
        'from-teal-50 to-teal-100 border-teal-200 text-teal-700',
    ];

    const colorClass = colors[index % colors.length];
    const gradients = [
        'from-blue-500 to-cyan-500',
        'from-purple-500 to-pink-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-red-500',
        'from-pink-500 to-rose-500',
        'from-cyan-500 to-blue-500',
        'from-amber-500 to-orange-500',
        'from-indigo-500 to-purple-500',
        'from-red-500 to-pink-500',
        'from-teal-500 to-emerald-500',
    ];

    return (
        <div className={`bg-gradient-to-br ${colorClass} p-4 rounded-xl border transform transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
            <div className="text-xs font-semibold text-gray-700 mb-2 line-clamp-2">{metric.label}</div>
            <div className="text-3xl font-bold mb-2 text-gray-900">
                {metric.value}
            </div>
            {metric.percentage !== undefined && (
                <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${gradients[index % gradients.length]}`}
                        style={{ width: `${Math.min(Number(metric.percentage), 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// 크리에이터 분석 뷰 컴포넌트
// ─────────────────────────────────────────────

function CreatorReportView({ report }: { report: CreatorReport | null }) {
    if (!report) {
        return <div className="text-center py-12 text-gray-500">크리에이터 분석 보고서가 아직 생성되지 않았습니다.</div>;
    }

    const removeMarkdown = (text: string): string => {
        if (!text) return "";
        let cleaned = text.replace(/^#{1,6}\s+/gm, "");
        cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
        cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1");
        cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
        cleaned = cleaned.replace(/^---+$/gm, "");
        cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
        return cleaned.trim();
    };

    const getContentMd = (section: any): string => {
        if (!section) return "";
        let content = "";
        if (typeof section === "string") {
            content = section;
        } else if (section.content_md) {
            content = section.content_md;
        } else {
            return JSON.stringify(section, null, 2);
        }
        return removeMarkdown(content);
    };

    const getScorePercent = (score: number | null): number => {
        if (score === null || score === undefined) return 0;
        return Math.round(score);
    };

    const getGradeColor = (grade: string | null): string => {
        if (!grade) return "bg-gray-100 text-gray-700";
        const gradeUpper = grade.toUpperCase();
        if (gradeUpper === "A" || gradeUpper.includes("GO")) return "bg-emerald-100 text-emerald-700";
        if (gradeUpper === "B") return "bg-blue-100 text-blue-700";
        if (gradeUpper === "C") return "bg-yellow-100 text-yellow-700";
        return "bg-gray-100 text-gray-700";
    };

    const radarData = [
        { subject: '참여도', score: report.engagement_score ?? 0, fullMark: 100 },
        { subject: '조회수', score: report.views_score ?? 0, fullMark: 100 },
        { subject: '수요', score: report.demand_score ?? 0, fullMark: 100 },
        { subject: '포맷', score: report.format_score ?? 0, fullMark: 100 },
        { subject: '일관성', score: report.consistency_score ?? 0, fullMark: 100 },
    ];

    const blcScore = report.blc_score ?? 0;
    const gaugeData = [
        { name: 'Score', value: blcScore, fill: blcScore >= 80 ? '#10b981' : blcScore >= 60 ? '#3b82f6' : '#f59e0b' },
        { name: 'Remaining', value: 100 - blcScore, fill: '#e5e7eb' }
    ];

    const barData = [
        { name: '참여도', score: report.engagement_score ?? 0, color: '#a855f7' },
        { name: '조회수', score: report.views_score ?? 0, color: '#3b82f6' },
        { name: '수요', score: report.demand_score ?? 0, color: '#10b981' },
        { name: '포맷', score: report.format_score ?? 0, color: '#f97316' },
        { name: '일관성', score: report.consistency_score ?? 0, color: '#ec4899' },
    ];

    return (
        <div className="space-y-8">
            {/* 헤더 요약 */}
            <section className="border-2 border-gray-200 rounded-2xl p-8 bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-xl">
                <div className="flex items-start justify-between flex-wrap gap-6">
                    <div className="flex-1 min-w-[300px]">
                        <div className="flex items-center gap-3 mb-3">
                            <Award className="w-8 h-8 text-blue-600" />
                            <h2 className="text-3xl font-bold text-gray-900">
                                {report.title}
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className={`px-5 py-2.5 rounded-full font-bold text-lg shadow-md ${getGradeColor(report.blc_grade)}`}>
                                BLC 등급: {report.blc_grade ?? "-"}
                                {report.blc_grade_label ? ` (${report.blc_grade_label})` : ""}
                            </div>
                            <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-md">
                                Tier: {report.blc_tier ?? "-"}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/70 backdrop-blur px-4 py-3 rounded-xl">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold">구독자:</span>
                            <span className="text-xl font-bold text-gray-900">
                                {report.subscriber_count != null ? report.subscriber_count.toLocaleString() : "-"}명
                            </span>
                        </div>
                    </div>

                    {/* BLC 점수 게이지 차트 */}
                    <div className="text-center">
                        <div className="relative w-40 h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={gaugeData}
                                        cx="50%"
                                        cy="50%"
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius={50}
                                        outerRadius={70}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {gaugeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-5xl font-bold text-gray-900">
                                    {report.blc_score ?? "-"}
                                </div>
                                <div className="text-xs text-gray-600 font-medium">BLC 점수</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 시각화 대시보드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 레이더 차트 */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                            종합 성과 분석
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                                />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                <Radar
                                    name="점수"
                                    dataKey="score"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.6}
                                    strokeWidth={2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 막대 그래프 */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-orange-600" />
                            세부 점수 비교
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barData} layout="vertical">
                                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                                    width={60}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 핵심 지표 카드 - 애니메이션 강화 */}
            {(report.engagement_score !== null || report.views_score !== null || report.demand_score !== null) && (
                <section className="border-2 border-gray-200 rounded-2xl p-6 bg-white shadow-lg">
                    <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                        <Eye className="w-6 h-6 text-blue-600" />
                        핵심 지표
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {report.engagement_score !== null && (
                            <ScoreCard
                                title="참여도 점수"
                                score={getScorePercent(report.engagement_score)}
                                color="purple"
                                icon={<Star className="w-5 h-5" />}
                            />
                        )}
                        {report.views_score !== null && (
                            <ScoreCard
                                title="조회수 점수"
                                score={getScorePercent(report.views_score)}
                                color="blue"
                                icon={<Eye className="w-5 h-5" />}
                            />
                        )}
                        {report.demand_score !== null && (
                            <ScoreCard
                                title="수요 점수"
                                score={getScorePercent(report.demand_score)}
                                color="emerald"
                                icon={<TrendingUp className="w-5 h-5" />}
                            />
                        )}
                        {report.format_score !== null && (
                            <ScoreCard
                                title="포맷 점수"
                                score={getScorePercent(report.format_score)}
                                color="orange"
                                icon={<Award className="w-5 h-5" />}
                            />
                        )}
                    </div>
                </section>
            )}

            {/* 텍스트 섹션들 */}
            <ReportSection
                title="1. 한 장 요약"
                content={getContentMd(report.executive_summary)}
                color="blue"
            />

            <ReportSection
                title="2. 채널 심층 분석"
                content={getContentMd(report.deep_analysis)}
                color="purple"
            />

            <ReportSection
                title="3. BLC 매칭"
                content={getContentMd(report.blc_matching)}
                color="emerald"
            />

            <ReportSection
                title="4. 리스크 & 대응"
                content={getContentMd(report.risk_mitigation)}
                color="orange"
                icon={<AlertCircle className="w-6 h-6" />}
            />
        </div>
    );
}

// 점수 카드 컴포넌트
function ScoreCard({ title, score, color, icon }: { title: string; score: number; color: string; icon: React.ReactNode }) {
    const colorMap: Record<string, { bg: string; text: string; bar: string; border: string }> = {
        purple: { bg: 'from-purple-50 to-purple-100', text: 'text-purple-700', bar: 'bg-purple-500', border: 'border-purple-200' },
        blue: { bg: 'from-blue-50 to-blue-100', text: 'text-blue-700', bar: 'bg-blue-500', border: 'border-blue-200' },
        emerald: { bg: 'from-emerald-50 to-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', border: 'border-emerald-200' },
        orange: { bg: 'from-orange-50 to-orange-100', text: 'text-orange-700', bar: 'bg-orange-500', border: 'border-orange-200' },
    };

    const colors = colorMap[color];

    return (
        <div className={`p-5 bg-gradient-to-br ${colors.bg} rounded-xl border ${colors.border} transform transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
            <div className={`flex items-center gap-2 ${colors.text} mb-2`}>
                {icon}
                <div className="text-xs font-semibold">{title}</div>
            </div>
            <div className={`text-3xl font-bold ${colors.text} mb-3`}>{score}</div>
            <div className={`w-full h-3 bg-white/50 rounded-full overflow-hidden shadow-inner`}>
                <div
                    className={`h-full ${colors.bar} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}

// 리포트 섹션 컴포넌트
function ReportSection({ title, content, color, icon }: { title: string; content: string; color: string; icon?: React.ReactNode }) {
    const colorMap: Record<string, string> = {
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        emerald: 'from-emerald-500 to-emerald-600',
        orange: 'from-orange-500 to-orange-600',
    };

    return (
        <section className="border-2 border-gray-200 rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-1 h-10 bg-gradient-to-b ${colorMap[color]} rounded-full`}></div>
                {icon && <div className="text-gray-700">{icon}</div>}
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <div className="text-base leading-relaxed whitespace-pre-wrap break-words text-gray-700 bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100">
                {content}
            </div>
        </section>
    );
}