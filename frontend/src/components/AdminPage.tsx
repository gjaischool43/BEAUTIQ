// src/components/AdminPage.tsx
import { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "./ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface AdminPageProps {
    onBack: () => void;
    onOpenReportDetail: (reportId: number) => void;
    isAdminAuthed: boolean;                // App 쪽 state (동기화용)
    onAdminLoginSuccess: () => void;      // App에 "로그인됨" 알려주는 콜백
    onAdminLogout: () => void;            // App에 "로그아웃됨" 알려주는 콜백
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
    creator_report_id?: number | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

/**
 * 로그인 화면 컴포넌트
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
        <div className="bg-muted/20 min-h-screen flex items-center justify-center px-4 pt-24 relative">
            <div className="absolute top-28 left-4">
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

export function AdminPage({
    onBack,
    onOpenReportDetail,
    isAdminAuthed,
    onAdminLoginSuccess,
    onAdminLogout,
}: AdminPageProps) {
    // ✅ localStorage 기반 관리자 인증 상태
    const [isAuthed, setIsAuthed] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem("beautiq_admin_authed") === "true";
    });

    const [items, setItems] = useState<AdminRequestItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [runningId, setRunningId] = useState<number | null>(null);

    // ✅ 로그인 상태 변화 시, localStorage & App state 동기화 + 리스트 로드
    useEffect(() => {
        if (isAuthed) {
            // localStorage에 저장
            try {
                localStorage.setItem("beautiq_admin_authed", "true");
            } catch {
                // 로컬스토리지 사용 불가한 환경일 수도 있으니 조용히 무시
            }

            // App 쪽에도 "로그인됨" 알려주기
            if (!isAdminAuthed) {
                onAdminLoginSuccess();
            }

            // 의뢰 목록 가져오기
            fetchRequests();
        } else {
            try {
                localStorage.removeItem("beautiq_admin_authed");
            } catch {
                //
            }

            // App 쪽에도 "로그아웃됨" 알려주기
            if (isAdminAuthed) {
                onAdminLogout();
            }

            // 로그아웃 시 리스트 비우기
            setItems([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthed]);

    // ✅ 의뢰 목록 조회
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${API_BASE}/admin/requests`);
            if (!resp.ok) {
                throw new Error(`요청 실패 (status ${resp.status})`);
            }

            const raw = (await resp.json()) as {
                items: {
                    request_id: number;
                    activity_name: string;
                    platform: string;
                    channel_name: string;
                    category_code: string;
                    brand_concept: string;
                    contact_method: string;
                    email: string;
                    status: "idle" | "ready";
                    report_id: number | null;
                    is_exported: boolean;
                }[];
            };

            const normalized: AdminRequestItem[] = raw.items.map((it) => ({
                request_id: it.request_id,
                activity_name: it.activity_name,
                platform: it.platform,
                channel_name: it.channel_name,
                category_code: it.category_code,
                brand_concept: it.brand_concept,
                contact_method: it.contact_method,
                email: it.email,
                status: it.status,
                report_id: it.report_id,
                is_exported: it.is_exported,
            }));

            setItems(normalized);
        } catch (err: any) {
            toast.error(
                err?.message || "요청 목록을 불러오는 중 오류가 발생했습니다.",
            );
        } finally {
            setLoading(false);
        }
    };

    // ✅ 분석 실행
    const handleRunAnalysis = async (requestId: number) => {
        // 1) 즉시 상태를 preparing으로
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
                throw new Error(
                    err?.detail || `분석 시작 실패 (status ${resp.status})`,
                );
            }

            const data = (await resp.json()) as {
                request_id: number;
                status: "preparing" | "ready" | "idle";
                message?: string;
                report_id?: number | null;
                creator_report_id?: number | null;
            };

            toast.success(data.message || "분석이 완료되었습니다.");

            if (data.status === "ready") {
                // 분석 완료 → 목록 새로고침
                await fetchRequests();
            } else {
                // 아직 준비 중이면 상태만 업데이트
                setItems((prev) =>
                    prev.map((item) =>
                        item.request_id === requestId
                            ? {
                                ...item,
                                status: data.status as CurrentStatus,
                                report_id:
                                    data.report_id ?? item.report_id,
                                creator_report_id:
                                    data.creator_report_id ??
                                    item.creator_report_id,
                            }
                            : item,
                    ),
                );
            }
        } catch (err: any) {
            toast.error(err?.message || "분석 중 오류가 발생했습니다.");
            // 실패 시 idle로 롤백
            setItems((prev) =>
                prev.map((item) =>
                    item.request_id === requestId
                        ? { ...item, status: "idle" }
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
        return (
            <span className="text-xs text-muted-foreground">분석 전</span>
        );
    };

    // 🔐 로그인 안 된 상태 → 로그인 화면
    if (!isAuthed) {
        return (
            <AdminLoginScreen
                onSuccess={() => {
                    setIsAuthed(true);
                }}
                onBack={onBack}
            />
        );
    }

    // 🔓 로그인 이후 → 관리자 페이지
    return (
        <div className="bg-muted/20 min-h-screen pt-24 pb-12">
            <div className="container mx-auto max-w-5xl px-6">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={onBack}>
                        메인으로
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
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
                        <CardDescription>
                            뷰티 인플루언서 의뢰 내역과 BM 리포트 상태를
                            확인하고, 분석을 실행할 수 있습니다.
                        </CardDescription>
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
                                        <TableRow
                                            key={item.request_id}
                                        >
                                            <TableCell>
                                                {item.request_id}
                                            </TableCell>
                                            <TableCell>
                                                {item.activity_name}
                                            </TableCell>
                                            <TableCell>
                                                {item.channel_name}
                                            </TableCell>
                                            <TableCell>
                                                {item.category_code}
                                            </TableCell>
                                            <TableCell>
                                                {renderStatusBadge(
                                                    item.status,
                                                )}
                                            </TableCell>
                                            <TableCell className="space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={
                                                        runningId ===
                                                        item.request_id
                                                    }
                                                    onClick={() =>
                                                        handleRunAnalysis(
                                                            item.request_id,
                                                        )
                                                    }
                                                >
                                                    {runningId ===
                                                        item.request_id
                                                        ? "분석중..."
                                                        : "분석하기"}
                                                </Button>

                                                {item.status ===
                                                    "ready" &&
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
