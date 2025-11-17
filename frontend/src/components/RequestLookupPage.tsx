// src/components/RequestLookupPage.tsx
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

interface RequestLookupPageProps {
    onBack: () => void;
}

interface LookupReport {
    report_id: number;
    request_id: number;
    title?: string | null;
    contents: any;
}

export function RequestLookupPage({ onBack }: RequestLookupPageProps) {
    const [email, setEmail] = useState("");
    const [viewPw, setViewPw] = useState("");
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<LookupReport | null>(null);

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

            const data = await resp.json() as {
                available: boolean;
                message: string;
                report?: LookupReport | null;
            };

            if (!data.available) {
                toast.info(data.message || "리포트가 준비중입니다.");
                // 메인 페이지로 돌아가기
                onBack();
                return;
            }

            setReport(data.report ?? null);
            toast.success("리포트를 불러왔습니다.");
        } catch (err: any) {
            toast.error(err.message || "서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/20 py-12">
            <div className="container mx-auto max-w-3xl px-6">
                <Button variant="ghost" onClick={onBack} className="mb-6">
                    메인으로
                </Button>

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
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "조회 중..." : "조회하기"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {report && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{report.title || "BM 보고서"}</CardTitle>
                            <CardDescription>요약된 BM 리포트 내용입니다.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* contents 구조에 맞게 렌더링 로직을 나중에 커스터마이징 */}
                            <Textarea
                                readOnly
                                className="min-h-[300px]"
                                value={JSON.stringify(report.contents, null, 2)}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
