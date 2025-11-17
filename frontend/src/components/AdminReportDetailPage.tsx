// src/components/AdminReportDetailPage.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

interface AdminReportDetailPageProps {
    reportId: number;
    onBack: () => void;
}

interface ReportDetail {
    report_id: number;
    request_id: number;
    title?: string | null;
    contents: any;
    is_exported: boolean;
}

export function AdminReportDetailPage({ reportId, onBack }: AdminReportDetailPageProps) {
    const [report, setReport] = useState<ReportDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const resp = await fetch(`${API_BASE}/admin/report/${reportId}`);
                if (!resp.ok) {
                    throw new Error(`보고서 조회 실패 (status ${resp.status})`);
                }
                const data = await resp.json() as ReportDetail;
                setReport(data);
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
            const data = await resp.json() as { report_id: number; is_exported: boolean };
            setReport((prev) => prev ? { ...prev, is_exported: data.is_exported } : prev);
            toast.success("내보내기가 완료되었습니다. 이제 의뢰 조회에서 리포트를 볼 수 있습니다.");
        } catch (err: any) {
            toast.error(err.message || "내보내기 중 오류가 발생했습니다.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/20 py-12">
            <div className="container mx-auto max-w-4xl px-6">
                <Button variant="ghost" onClick={onBack} className="mb-6">
                    의뢰 목록으로
                </Button>

                <Card>
                    <CardHeader className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle>{report?.title || "BM 보고서"}</CardTitle>
                            <CardDescription>
                                Request ID: {report?.request_id}
                            </CardDescription>
                        </div>
                        <Button
                            variant={report?.is_exported ? "outline" : "default"}
                            onClick={handleExport}
                            disabled={exporting || !report || report.is_exported}
                        >
                            {report?.is_exported ? "내보내기 완료" : exporting ? "내보내기 중..." : "내보내기"}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading || !report ? (
                            <div>불러오는 중...</div>
                        ) : (
                            <Textarea
                                readOnly
                                className="min-h-[400px]"
                                value={JSON.stringify(report.contents, null, 2)}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
