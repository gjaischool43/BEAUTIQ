// src/components/AdminPage.tsx
import { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

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
    brand_concept: string;
    contact_method: string;
    email: string;
    status: CurrentStatus;
    report_id: number | null;
    is_exported: boolean;
    // 🔹 크리에이터 리포트 ID도 상태에 들고 있으면 나중에 편함
    creator_report_id?: number | null;
}
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";



export function AdminPage({ onBack, onOpenReportDetail }: AdminPageProps) {
    const [items, setItems] = useState<AdminRequestItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [runningId, setRunningId] = useState<number | null>(null); // 어떤 요청이 분석중인지 표시
    const [isAuthed, setIsAuthed] = useState<boolean>(() => {
        return localStorage.getItem("beautiq_admin_authed") === "true";
    });

    const handleAnalyze = async (requestId: number) => {
        // 1) Optimistic: 상태를 'preparing'으로 먼저 변경
        setItems(prev =>
            prev.map(item =>
                item.request_id === requestId
                    ? { ...item, status: "preparing" }
                    : item
            )
        );

        try {
            const resp = await fetch(`${API_BASE}/admin/requests/${requestId}/start-analysis`, {
                method: "POST",
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => null);
                throw new Error(err?.detail || `분석 요청 실패 (status ${resp.status})`);
            }

            // 🔹 백엔드 AnalysisStartResp 와 맞춰서 타입 정의
            const data = await resp.json() as {
                request_id: number;
                status: "ready" | "idle" | "processing";
                report_id?: number | null;
                creator_report_id?: number | null;
                message?: string;
            };

            setItems(prev =>
                prev.map(item =>
                    item.request_id === requestId
                        ? {
                            ...item,
                            status: data.status as CurrentStatus,
                            report_id: data.report_id ?? item.report_id,
                            creator_report_id: data.creator_report_id ?? item.creator_report_id,
                        }
                        : item
                )
            );

            toast.success(data.message || "분석이 완료되었습니다.");
        } catch (err: any) {
            // 실패 시 다시 idle로 롤백
            setItems(prev =>
                prev.map(item =>
                    item.request_id === requestId
                        ? { ...item, status: "idle" }
                        : item
                )
            );
            toast.error(err.message || "분석 중 오류가 발생했습니다.");
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${API_BASE}/admin/requests`);
            if (!resp.ok) {
                throw new Error(`요청 실패 (status ${resp.status})`);
            }

            // 백엔드 응답
            const raw = (await resp.json()) as {
                items: {
                    request_id: number;
                    activity_name: string;
                    platform: string;
                    channel_name: string;
                    category_code: string;
                    brand_concept: string;   // 🔹 추가
                    contact_method: string;  // 🔹 추가
                    email: string;
                    status: "idle" | "ready"; // 백엔드는 두 값만 옴
                    report_id: number | null;
                    is_exported: boolean;
                }[];
            };

            // 프론트에서 CurrentStatus 로 변환 (idle / ready 그대로 사용)
            // 프론트에서 CurrentStatus 로 변환 (idle / ready 그대로 사용)
            const normalized: AdminRequestItem[] = raw.items.map((it) => ({
                request_id: it.request_id,
                activity_name: it.activity_name,
                platform: it.platform,
                channel_name: it.channel_name,
                category_code: it.category_code,
                brand_concept: it.brand_concept,     // 🔹 추가
                contact_method: it.contact_method,   // 🔹 추가
                email: it.email,
                status: it.status, // "idle" 또는 "ready"
                report_id: it.report_id,
                is_exported: it.is_exported,
                // creator_report_id: undefined, // 나중에 백엔드에서 내려주면 여기에 매핑
            }));

            setItems(normalized);
        } catch (err: any) {
            toast.error(err.message || "요청 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 🔹 로그인 되어 있을 때만 의뢰 목록을 불러오도록
        if (isAuthed) {
            fetchRequests();
        }
    }, [API_BASE, isAuthed]);

    // 🔹 분석하기 버튼 핸들러
    const handleRunAnalysis = async (requestId: number) => {
        // 1) 클릭 즉시, 로컬 상태를 '준비중(preparing)'으로 바꾸기 (낙관적 갱신)
        setItems((prev) =>
            prev.map((item) =>
                item.request_id === requestId
                    ? { ...item, status: "preparing" }
                    : item,
            ),
        );
        setRunningId(requestId);

        try {
            const resp = await fetch(
                `${API_BASE}/admin/requests/${requestId}/start-analysis`,
                {
                    method: "POST",
                },
            );

            if (!resp.ok) {
                const err = await resp.json().catch(() => null);
                // request 미존재 등의 경우
                throw new Error(
                    err?.detail || `분석 시작 실패 (status ${resp.status})`,
                );
            }

            const data = (await resp.json()) as {
                request_id: number;
                status: "preparing" | "ready";
                message: string;
            };

            toast.success(data.message || "분석이 완료되었습니다.");

            // 2) 응답에 따라 상태 업데이트
            if (data.status === "ready") {
                // 분석 완료 → '준비완료'로 표시 & 리스트 새로고침
                await fetchRequests();
            } else {
                // 아직 준비중 상태라면 그대로 두거나, 수동 갱신
                setItems((prev) =>
                    prev.map((item) =>
                        item.request_id === requestId
                            ? { ...item, status: "preparing" }
                            : item,
                    ),
                );
            }
        } catch (err: any) {
            // 에러 → '준비중'을 다시 'idle'로 롤백 + 에러 메시지
            toast.error(err.message || "분석 중 오류가 발생했습니다.");

            setItems((prev) =>
                prev.map((item) =>
                    item.request_id === requestId
                        ? { ...item, status: "idle" } // 분석 전 상태로 되돌리기
                        : item,
                ),
            );
        } finally {
            setRunningId(null);
        }
    };

    const renderStatusBadge = (status: CurrentStatus) => {
        if (status === "ready") {
            return (
                <Badge
                    variant="outline"
                    className="bg-emerald-50 border-emerald-300"
                >
                    준비완료
                </Badge>
            );
        }
        if (status === "preparing") {
            return (
                <Badge
                    variant="outline"
                    className="bg-yellow-50 border-yellow-300"
                >
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

    // 🔹 로그인 안 되어 있으면 관리자 로그인 화면 먼저 노출
    if (!isAuthed) {
        return (
            <AdminLoginScreen
                onBack={onBack}
                onSuccess={() => {
                    setIsAuthed(true);
                    localStorage.setItem("beautiq_admin_authed", "true");
                }}
            />
        );
    }

    // 🔹 로그인 후에만 실제 관리자 페이지 렌더
    return (
        <div className="min-h-screen bg-muted/20 py-12">
            <div className="container mx-auto max-w-5xl px-6">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={onBack}>
                        메인으로
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            localStorage.removeItem("beautiq_admin_authed");
                            setIsAuthed(false);
                            toast.success("로그아웃되었습니다.");
                        }}
                    >
                        로그아웃
                    </Button>
                </div>

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
                                                    disabled={
                                                        runningId === item.request_id
                                                    }
                                                    onClick={() =>
                                                        handleAnalyze(
                                                            item.request_id,
                                                        )
                                                    }
                                                >
                                                    {runningId === item.request_id
                                                        ? "분석중..."
                                                        : "분석하기"}
                                                </Button>

                                                {/* 준비완료 + report_id 존재 시 보고서 보기 */}
                                                {item.status === "ready" &&
                                                    item.report_id && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                onOpenReportDetail(
                                                                    item.report_id!,
                                                                )
                                                            }
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

/**
 * 관리자 로그인 화면
 */
function AdminLoginScreen({
    onSuccess,
    onBack,
}: {
    onSuccess: () => void;
    onBack: () => void;
}) {
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!password) {
            toast.error("관리자 비밀번호를 입력해주세요.");
            return;
        }

        setSubmitting(true);
        try {
            if (!ADMIN_PASSWORD) {
                toast.error(
                    "환경변수 VITE_ADMIN_PASSWORD가 설정되지 않았습니다.",
                );
                return;
            }

            if (password !== ADMIN_PASSWORD) {
                toast.error("관리자 비밀번호가 올바르지 않습니다.");
                return;
            }

            toast.success("관리자 로그인 성공");
            onSuccess();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/20 flex items-center justify-center px-4">
            <div className="absolute top-4 left-4">
                <Button variant="ghost" onClick={onBack}>
                    메인으로
                </Button>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>관리자 로그인</CardTitle>
                    <CardDescription>
                        관리자 비밀번호를 입력하면 의뢰 내역 및 BM 리포트를
                        관리할 수 있습니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="adminPw">관리자 비밀번호</Label>
                            <Input
                                id="adminPw"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="관리자 비밀번호를 입력하세요"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={submitting}
                        >
                            {submitting ? "확인 중..." : "로그인"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
