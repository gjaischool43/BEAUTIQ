// src/components/AdminPage.tsx
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "./ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Eye } from "lucide-react";
import { FormData } from "./RequestFormPage";

interface AdminPageProps {
    onBack: () => void;
    submissions: FormData[];
}

export function AdminPage({ onBack, submissions }: AdminPageProps) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [selectedSubmission, setSelectedSubmission] =
        useState<FormData | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === "admin" && password === "admin") {
            setIsLoggedIn(true);
            toast.success("로그인 성공");
        } else {
            toast.error("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
    };

    const handleViewDetail = (submission: FormData) => {
        setSelectedSubmission(submission);
        setIsDetailOpen(true);
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            skincare: "스킨케어",
            makeup: "메이크업",
            haircare: "헤어케어",
            bodycare: "바디케어",
            fragrance: "향수",
            other: "기타",
        };
        return labels[category] || category;
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-muted/20 flex items-center justify-center py-12">
                <div className="container mx-auto px-6 max-w-md">
                    <Button variant="ghost" onClick={onBack} className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        돌아가기
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle>관리자 로그인</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">아이디</Label>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="아이디를 입력하세요"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">비밀번호</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="비밀번호를 입력하세요"
                                    />
                                </div>

                                <Button type="submit" className="w-full">
                                    관리자 로그인
                                </Button>

                                <p className="text-sm text-muted-foreground text-center mt-4">
                                    Demo 계정: admin / admin
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 py-12">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={onBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            돌아가기
                        </Button>
                        <h1>의뢰서 관리 페이지</h1>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setIsLoggedIn(false);
                            setUsername("");
                            setPassword("");
                        }}
                    >
                        로그아웃
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>접수된 의뢰 목록</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {submissions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                아직 접수된 의뢰가 없습니다.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>활동명</TableHead>
                                            <TableHead>채널명</TableHead>
                                            <TableHead>제품 카테고리</TableHead>
                                            <TableHead>연락처</TableHead>
                                            <TableHead>이메일</TableHead>
                                            <TableHead className="text-right">액션</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {submissions.map((s, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{s.activityName}</TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {s.channelName}
                                                </TableCell>
                                                <TableCell>
                                                    {getCategoryLabel(s.productCategory)}
                                                </TableCell>
                                                <TableCell>{s.contact}</TableCell>
                                                <TableCell>{s.email}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleViewDetail(s)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" /> 보기
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>의뢰서 상세 정보</DialogTitle>
                        </DialogHeader>
                        {selectedSubmission && (
                            <div className="space-y-4">
                                <div>
                                    <Label>활동명</Label>
                                    <p className="mt-1">{selectedSubmission.activityName}</p>
                                </div>
                                <div>
                                    <Label>채널명</Label>
                                    <p className="mt-1">{selectedSubmission.channelName}</p>
                                </div>
                                <div>
                                    <Label>제품 카테고리</Label>
                                    <p className="mt-1">
                                        {getCategoryLabel(selectedSubmission.productCategory)}
                                    </p>
                                </div>
                                <div>
                                    <Label>브랜드 콘셉트</Label>
                                    <p className="mt-1 whitespace-pre-wrap">
                                        {selectedSubmission.brandConcept}
                                    </p>
                                </div>
                                <div>
                                    <Label>연락처</Label>
                                    <p className="mt-1">{selectedSubmission.contact}</p>
                                </div>
                                <div>
                                    <Label>이메일</Label>
                                    <p className="mt-1">{selectedSubmission.email}</p>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
