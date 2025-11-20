// -------------------------------------------------------
// src/components/RequestFormPage.tsx
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { DataQualityGuide } from "./DataQualityGuide";




interface RequestFormPageProps {
    onBack: () => void;
    onSubmit: (formData: FormData) => void;
}

const PLATFORM_OPTIONS = ["youtube", "instagram", "tiktok", "x", "etc"] as const;
type Platform = (typeof PLATFORM_OPTIONS)[number];

const CATEGORY_OPTIONS = [
    "skin_toner",
    "essence_serum_ampoule",
    "lotion",
    "cream",
    "mist_oil",
] as const;

type CategoryCode = (typeof CATEGORY_OPTIONS)[number];

export interface FormData {
    activityName: string;
    platform: Platform;
    channelName: string;
    productCategory: CategoryCode;
    brandConcept: string;
    contact: string;
    email: string;
    viewPassword: string;
}

export function RequestFormPage({ onBack, onSubmit }: RequestFormPageProps) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        activityName: "",
        platform: "youtube",
        channelName: "",
        productCategory: "skin_toner",
        brandConcept: "",
        contact: "",
        email: "",
        viewPassword: "",
    });

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple validation
        if (
            !formData.activityName ||
            !formData.platform ||
            !formData.channelName ||
            !formData.productCategory ||
            !formData.brandConcept ||
            !formData.contact ||
            !formData.email ||
            !formData.viewPassword
        ) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("올바른 이메일 주소를 입력해주세요.");
            return;
        }

        if (formData.viewPassword.length < 4) {
            toast.error("열람 비밀번호는 최소 4자 이상이어야 합니다.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                activity_name: formData.activityName,
                platform: formData.platform,
                channel_name: formData.channelName,
                category_code: formData.productCategory, // 값은 'skin_toner' 등
                brand_concept: formData.brandConcept,
                contact_method: formData.contact,
                email: formData.email,
                view_pw: formData.viewPassword,
            };

            console.log("[DEBUG] API_BASE = ", API_BASE);
            console.log("[DEBUG] payload = ", payload);

            const resp = await fetch(`${API_BASE}/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({} as any));
                throw new Error((err as any)?.detail || `요청 실패 (status ${resp.status})`);
            }

            toast.success("제출이 완료되었습니다. 담당자가 24시간 이내로 연락드립니다.");
            onSubmit(formData);

            setFormData({
                activityName: "",
                platform: "youtube",
                channelName: "",
                productCategory: "skin_toner",
                brandConcept: "",
                contact: "",
                email: "",
                viewPassword: "",
            });
        } catch (err: any) {
            toast.error(err.message || "서버 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center">
            <div className="w-full max-w-2xl mx-auto mt-20 px-4">
                <div className="container mx-auto px-6 max-w-3xl">
                    <Button variant="ghost" onClick={onBack} className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        돌아가기
                    </Button>

                    <DataQualityGuide />

                    {/* 의뢰서 작성 폼 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>의뢰서 작성</CardTitle>
                            <CardDescription>
                                아래 항목을 모두 입력해주세요. 입력하신 내용은 BM 보고서 작성에 활용됩니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* 활동명 */}
                                <div className="space-y-2">
                                    <Label htmlFor="activityName">
                                        활동명 <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="activityName"
                                        placeholder="예) 뷰티 크리에이터 김OO"
                                        value={formData.activityName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, activityName: e.target.value })
                                        }
                                    />
                                </div>

                                {/* 플랫폼 (네이티브 select) */}
                                <div className="space-y-2">
                                    <Label htmlFor="platform">
                                        플랫폼 <span className="text-destructive">*</span>
                                    </Label>
                                    <select
                                        id="platform"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={formData.platform}
                                        onChange={(e) =>
                                            setFormData({ ...formData, platform: e.target.value as Platform })
                                        }
                                    >
                                        <option value="" disabled>
                                            플랫폼을 선택하세요
                                        </option>
                                        {PLATFORM_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt === "x"
                                                    ? "X(트위터)"
                                                    : opt.charAt(0).toUpperCase() + opt.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 채널명 */}
                                <div className="space-y-2">
                                    <Label htmlFor="channelName">
                                        채널명 <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="channelName"
                                        placeholder="예) YouTube 링크 또는 Instagram 계정"
                                        value={formData.channelName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, channelName: e.target.value })
                                        }
                                    />
                                </div>

                                {/* 제품 카테고리 (네이티브 select) */}
                                <div className="space-y-2">
                                    <Label htmlFor="productCategory">
                                        제품 카테고리 <span className="text-destructive">*</span>
                                    </Label>
                                    <select
                                        id="productCategory"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={formData.productCategory}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                productCategory: e.target.value as CategoryCode,
                                            })
                                        }
                                    >
                                        <option value="" disabled>
                                            카테고리를 선택해주세요
                                        </option>
                                        <option value="skin_toner">스킨/토너</option>
                                        <option value="essence_serum_ampoule">에센스/세럼/앰플</option>
                                        <option value="lotion">로션</option>
                                        <option value="cream">크림</option>
                                        <option value="mist_oil">미스트/오일</option>
                                    </select>
                                </div>

                                {/* 브랜드 콘셉트 */}
                                <div className="space-y-2">
                                    <Label htmlFor="brandConcept">
                                        브랜드 콘셉트 <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="brandConcept"
                                        placeholder="원하시는 브랜드 콘셉트나 방향을 자유롭게 작성해주세요"
                                        value={formData.brandConcept}
                                        onChange={(e) =>
                                            setFormData({ ...formData, brandConcept: e.target.value })
                                        }
                                        rows={5}
                                    />
                                </div>

                                {/* 소통 연락처 */}
                                <div className="space-y-2">
                                    <Label htmlFor="contact">
                                        소통 연락처 <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="contact"
                                        placeholder="예) 010-1234-5678"
                                        value={formData.contact}
                                        onChange={(e) =>
                                            setFormData({ ...formData, contact: e.target.value })
                                        }
                                    />
                                </div>

                                {/* 이메일 */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        이메일 <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="example@email.com"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                    />
                                </div>

                                {/* 열람 비밀번호 */}
                                <div className="space-y-2">
                                    <Label htmlFor="viewPassword">
                                        열람 비밀번호 <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="viewPassword"
                                        type="password"
                                        placeholder="보고서 열람용 비밀번호 (최소 4자)"
                                        value={formData.viewPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, viewPassword: e.target.value })
                                        }
                                    />
                                </div>

                                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                                    {submitting ? "제출 중..." : "제출하기"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
