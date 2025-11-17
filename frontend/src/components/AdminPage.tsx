// src/components/AdminPage.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface AdminPageProps {
    onBack: () => void;
    onOpenReportDetail: (reportId: number) => void;
}
type CurrentStatus = "idle" | "preparing" | "ready";

interface AdminRequestItem {
    request_id: number;
    activity_name: string;
    platform: string;
    channel_name: string;
    category_code: string;
    email: string;

    // 현재상태: idle(분석 전) / preparing(분석중) / ready(준비완료)
    status: CurrentStatus;  //'preparing'은 프론트에서만 잠깐 쓰는 값

    report_id: number | null;   // ready 상태면 report_id 존재
    is_exported: boolean;
}

export function AdminPage({ onBack, onOpenReportDetail }: AdminPageProps) {
    const [items, setItems] = useState<AdminRequestItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [runningId, setRunningId] = useState<number | null>(null); // 어떤 요청이 분석중인지 표시

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${API_BASE}/admin/requests`);
            if (!resp.ok) {
                throw new Error(`요청 실패 (status ${resp.status})`);
            }

            // 백엔드 응답
            const raw = await resp.json() as {
                items: {
                    request_id: number;
                    activity_name: string;
                    platform: string;
                    channel_name: string;
                    category_code: string;
                    brand_concept: string;
                    contact_method: string;
                    email: string;
                    status: "idle" | "ready";   // 백엔드는 두 값만 옴
                    report_id: number | null;
                    is_exported: boolean;
                }[];
            };

            // 프론트에서 CurrentStatus 로 변환 (idle / ready 그대로 사용)
            const normalized: AdminRequestItem[] = raw.items.map((it) => ({
                request_id: it.request_id,
                activity_name: it.activity_name,
                platform: it.platform,
                channel_name: it.channel_name,
                category_code: it.category_code,
                email: it.email,
                status: it.status,          // "idle" 또는 "ready"
                report_id: it.report_id,
                is_exported: it.is_exported,
            }));

            setItems(normalized);
        } catch (err: any) {
            toast.error(err.message || "요청 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(); // 페이지 들어올 때마다 DB에서 가져오기
    }, [API_BASE]);

    // 🔹 분석하기 버튼 핸들러
    const handleRunAnalysis = async (requestId: number) => {
        // 1) 클릭 즉시, 로컬 상태를 '준비중(preparing)'으로 바꾸기 (낙관적 갱신)
        setItems((prev) =>
            prev.map((item) =>
                item.request_id === requestId
                    ? { ...item, status: "preparing" }
                    : item
            )
        );
        setRunningId(requestId);

        try {
            const resp = await fetch(`${API_BASE}/admin/requests/${requestId}/start-analysis`, {
                method: "POST",
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => null);
                // request 미존재 등의 경우
                throw new Error(err?.detail || `분석 시작 실패 (status ${resp.status})`);
            }

            const data = await resp.json() as {
                request_id: number;
                status: "preparing" | "ready";
                message: string;
            };

            toast.success(data.message || "분석이 완료되었습니다.");

            // 2) 응답에 따라 상태 업데이트
            if (data.status === "ready") {
                // 분석 완료 → '준비완료'로 표시 & 리스트 새로고침, 분석까지 끝났으면 /admin/requests 다시 불러오기
                await fetchRequests();
            } else {
                // 아직 준비중 상태라면 그대로 두거나, 수동 갱신
                setItems((prev) =>
                    prev.map((item) =>
                        item.request_id === requestId
                            ? { ...item, status: "preparing" }
                            : item
                    )
                );
            }
        } catch (err: any) {
            // 에러 → '준비중'을 다시 'idle'로 롤백 + 에러 메시지
            toast.error(err.message || "분석 중 오류가 발생했습니다.");

            setItems((prev) =>
                prev.map((item) =>
                    item.request_id === requestId
                        ? { ...item, status: "idle" }  // 분석 전 상태로 되돌리기
                        : item
                )
            );
        } finally {
            setRunningId(null);
        }
    };

    const renderStatusBadge = (status: CurrentStatus) => {
        if (status === "ready") {
            return (
                <Badge variant="outline" className="bg-emerald-50 border-emerald-300">
                    준비완료
                </Badge>
            );
        }
        if (status === "preparing") {
            return (
                <Badge variant="outline" className="bg-yellow-50 border-yellow-300">
                    준비중
                </Badge>
            );
        }
        // idle (아직 분석 시작 전)
        return (
            <span className="text-xs text-muted-foreground">
                분석 전
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-muted/20 py-12">
            <div className="container mx-auto max-w-5xl px-6">
                <Button variant="ghost" onClick={onBack} className="mb-6">
                    메인으로
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>의뢰 내역 관리</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div>불러오는 중...</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>활동명</TableHead>
                                        <TableHead>채널명</TableHead>
                                        <TableHead>카테고리</TableHead>
                                        <TableHead>현재상태</TableHead>
                                        <TableHead>액션</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.request_id}>
                                            <TableCell>{item.request_id}</TableCell>
                                            <TableCell>{item.activity_name}</TableCell>
                                            <TableCell>{item.channel_name}</TableCell>
                                            <TableCell>{item.category_code}</TableCell>
                                            <TableCell>
                                                {renderStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell className="space-x-2">
                                                {/* 분석하기 버튼 */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={runningId === item.request_id}
                                                    onClick={() => handleRunAnalysis(item.request_id)}
                                                >
                                                    {runningId === item.request_id ? "분석중..." : "분석하기"}
                                                </Button>

                                                {/* 준비완료 + report_id 존재 시 보고서 보기 */}
                                                {item.status === "ready" && item.report_id && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onOpenReportDetail(item.report_id!)}
                                                    >
                                                        보고서 보기
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

