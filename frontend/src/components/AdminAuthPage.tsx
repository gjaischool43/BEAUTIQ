// src/components/AdminAuthPage.tsx
// ...
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

interface AdminAuthPageProps {
    onBack: () => void;
    onSuccess: () => void;
}

export function AdminAuthPage({ onBack, onSuccess }: AdminAuthPageProps) {
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            toast.error("관리자 비밀번호를 입력해주세요.");
            return;
        }

        // 환경변수 비어있을 때 처리: 일단 경고 후 통과시킬 수도 있고, 막을 수도 있음
        if (!ADMIN_PASSWORD) {
            toast.error("관리자 비밀번호 환경변수가 설정되지 않았습니다. 서버 설정을 확인해주세요.");
            return;
        }

        setSubmitting(true);
        try {
            if (password === ADMIN_PASSWORD) {
                toast.success("관리자 인증에 성공했습니다.");
                onSuccess();
            } else {
                toast.error("비밀번호가 올바르지 않습니다.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-20 px-4">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                돌아가기
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>관리자 인증</CardTitle>
                    <CardDescription>
                        관리자 전용 페이지입니다. 관리자 비밀번호를 입력해 주세요.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="adminPassword">관리자 비밀번호</Label>
                            <Input
                                id="adminPassword"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="관리자 비밀번호"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? "확인 중..." : "확인"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
