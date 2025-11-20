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

import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "./ui/accordion";

export function DataQualityGuide() {
    return (
        <Accordion type="single" collapsible className="mb-8">
            <AccordionItem value="guide">
                <AccordionTrigger className="text-base font-semibold">
                    YouTube 크리에이터 분석 데이터 품질 기준 안내
                </AccordionTrigger>

                <AccordionContent className="text-sm leading-relaxed text-muted-foreground space-y-6">

                    {/* 1. 필수 기준 */}
                    <section className="space-y-2">
                        <h3 className="font-semibold text-base">1. 필수 기준 (분석 가능 여부 결정)</h3>
                        <div>
                            <h4 className="font-medium">최소 영상 수</h4>
                            <ul className="list-disc ml-5 space-y-1">
                                <li>최근 6개월 업로드 영상 10개 이상</li>
                                <li>통계적 신뢰도 확보 위한 최소 샘플 수</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium">최소 댓글 수</h4>
                            <ul className="list-disc ml-5 space-y-1">
                                <li>전체 댓글 300개 이상</li>
                                <li>Demand/Problem 분석의 최소 기준</li>
                            </ul>
                        </div>
                    </section>

                    {/* 2. 권장 기준 */}
                    <section className="space-y-2">
                        <h3 className="font-semibold text-base">2. 권장 기준 (고신뢰도 분석)</h3>
                        <ul className="list-disc ml-5 space-y-1">
                            <li>영상 15~20개 이상</li>
                            <li>전체 댓글 500~1000개 이상</li>
                            <li>영상당 평균 댓글 10개 이상</li>
                            <li>포맷별 영상 최소 5개 이상 (How-to, Review 등)</li>
                            <li>최소 8주 이상의 업로드 히스토리</li>
                        </ul>
                    </section>

                    {/* 3. 지표별 요구사항 요약 */}
                    <section>
                        <h3 className="font-semibold text-base mb-2">3. 지표별 요구사항 요약</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2 pr-2 text-left font-medium">지표</th>
                                        <th className="py-2 pr-2 text-left font-medium">필수 기준</th>
                                        <th className="py-2 pr-2 text-left font-medium">권장 기준</th>
                                        <th className="py-2 text-left font-medium">신뢰도</th>
                                    </tr>
                                </thead>
                                <tbody className="align-top">
                                    <tr className="border-b">
                                        <td className="py-2 pr-2">Engagement</td>
                                        <td className="py-2 pr-2">영상 10개</td>
                                        <td className="py-2 pr-2">15개 이상</td>
                                        <td className="py-2">높음</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 pr-2">Demand</td>
                                        <td className="py-2 pr-2">댓글 300개</td>
                                        <td className="py-2 pr-2">1000개 이상</td>
                                        <td className="py-2">중간→높음</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-2">Format Fit</td>
                                        <td className="py-2 pr-2">포맷별 5개</td>
                                        <td className="py-2 pr-2">10개 이상</td>
                                        <td className="py-2">낮음→높음</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 4. 체크리스트 */}
                    <section className="space-y-2">
                        <h3 className="font-semibold text-base">4. 의뢰 전 체크리스트</h3>
                        <ul className="list-disc ml-5 space-y-1">
                            <li>최근 6개월 이내 영상 10개 이상인가요?</li>
                            <li>댓글 기능이 활성화된 영상이 대부분인가요?</li>
                            <li>영상당 평균 10개 이상 댓글이 있나요?</li>
                            <li>월 1회 이상 업로드가 유지되나요?</li>
                            <li>별도 포맷 분석이 필요하면 해당 포맷 영상이 5개 이상인가요?</li>
                        </ul>
                    </section>

                    <p className="text-xs text-muted-foreground">
                        기준을 모두 충족하지 않아도 분석은 가능합니다.
                        다만 보고서 내 &quot;데이터 품질&quot; 섹션에서 신뢰도를 함께 안내드리니 참고해 주세요.
                    </p>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

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
    );
}
