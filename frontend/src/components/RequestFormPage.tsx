import react, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface RequestFormPageProps {
  onBack: () => void;
  onSubmit: (formData: FormData) => void;
}

const PLATFORM_OPTIONS = ["youtube", "instagram", "tiktok", "x", "etc"] as const;
type Platform = (typeof PLATFORM_OPTIONS)[number];

export interface FormData {
  activityName: string;
  platform: Platform;
  channelName: string;
  productCategory: CategoryCode; // 아래에서 정의
  brandConcept: string;
  contact: string;
  email: string;
  viewPassword: string;
}

const CATEGORY_OPTIONS = [
  "skin_toner",
  "essence_serum_ampoule",
  "lotion",
  "cream",
  "mist_oil",
] as const;
type CategoryCode = (typeof CATEGORY_OPTIONS)[number];

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

    // Validation (간단)
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
      toast.error("모든 항목을 입력해주세요");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("올바른 이메일 주소를 입력해주세요");
      return;
    }

    if (formData.viewPassword.length < 4) {
      toast.error("열람 비밀번호는 최소 4자 이상이어야 합니다");
      return;
    }

    setSubmitting(true);
    try {
      // 백엔드와 매핑되는 필드명으로 변환
      const payload = {
        activity_name: formData.activityName,
        platform: formData.platform,
        channel_name: formData.channelName,
        category_code: formData.productCategory,
        brand_concept: formData.brandConcept,
        contact_method: formData.contact,
        email: formData.email,
        view_pw: formData.viewPassword, // 서버에서 bcrypt 해시
      };

      const resp = await fetch(`${API_BASE}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.detail || `요청 실패 (status ${resp.status})`);
      }

      toast.success("제출이 완료되었습니다. 담당자가 24시간 이내에 연락드립니다.");

      // 부모 훅도 그대로 호출(필요 시)
      onSubmit(formData);

      // Reset form
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
      toast.error(err.message || "서버 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-12">
      <div className="container mx-auto px-6 max-w-3xl">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>서비스 의뢰서 작성</CardTitle>
            <CardDescription>
              아래 항목을 모두 입력해주세요. 입력된 내용은 BM 보고서 제작에 활용됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="activityName">
                  활동명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="activityName"
                  placeholder="예: 뷰티크리에이터 김OO"
                  value={formData.activityName}
                  onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">
                  플랫폼 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, platform: value as Platform })
                  }
                >
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="플랫폼을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt === "x" ? "X(트위터)" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="channelName">
                  채널명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="channelName"
                  placeholder="예: YouTube 링크 또는 Instagram 계정명"
                  value={formData.channelName}
                  onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productCategory">
                  제품 카테고리 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.productCategory}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, productCategory: value as CategoryCode })
                  }
                >
                  <SelectTrigger id="productCategory">
                    <SelectValue placeholder="카테고리를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skin_toner">스킨/토너</SelectItem>
                    <SelectItem value="essence_serum_ampoule">에센스/세럼/앰플</SelectItem>
                    <SelectItem value="lotion">로션</SelectItem>
                    <SelectItem value="cream">크림</SelectItem>
                    <SelectItem value="mist_oil">미스트/오일</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandConcept">
                  브랜드 콘셉트 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="brandConcept"
                  placeholder="원하시는 브랜드 콘셉트나 방향성을 자유롭게 작성해주세요"
                  value={formData.brandConcept}
                  onChange={(e) => setFormData({ ...formData, brandConcept: e.target.value })}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">
                  소통 연락처 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact"
                  placeholder="예: 010-1234-5678"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="viewPassword">
                  열람 비밀번호 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="viewPassword"
                  type="password"
                  placeholder="보고서 열람용 비밀번호(최소 4자)"
                  value={formData.viewPassword}
                  onChange={(e) => setFormData({ ...formData, viewPassword: e.target.value })}
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

// interface RequestFormPageProps {
//   onBack: () => void;
//   onSubmit: (formData: FormData) => void;
// }

// export interface FormData {
//   activityName: string;
//   channelName: string;
//   productCategory: string;
//   brandConcept: string;
//   contact: string;
//   email: string;
// }

// export function RequestFormPage({ onBack, onSubmit }: RequestFormPageProps) {
//   const [formData, setFormData] = useState<FormData>({
//     activityName: "",
//     channelName: "",
//     productCategory: "",
//     brandConcept: "",
//     contact: "",
//     email: "",
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validation
//     if (
//       !formData.activityName ||
//       !formData.channelName ||
//       !formData.productCategory ||
//       !formData.brandConcept ||
//       !formData.contact ||
//       !formData.email
//     ) {
//       toast.error("모든 항목을 입력해주세요");
//       return;
//     }

//     // Email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(formData.email)) {
//       toast.error("올바른 이메일 주소를 입력해주세요");
//       return;
//     }

//     onSubmit(formData);
//     toast.success("제출이 완료되었습니다. 담당자가 24시간 이내에 연락드립니다.");

//     // Reset form
//     setFormData({
//       activityName: "",
//       channelName: "",
//       productCategory: "",
//       brandConcept: "",
//       contact: "",
//       email: "",
//     });
//   };

//   return (
//     <div className="min-h-screen bg-muted/20 py-12">
//       <div className="container mx-auto px-6 max-w-3xl">
//         <Button
//           variant="ghost"
//           onClick={onBack}
//           className="mb-6"
//         >
//           <ArrowLeft className="w-4 h-4 mr-2" />
//           돌아가기
//         </Button>

//         <Card>
//           <CardHeader>
//             <CardTitle>서비스 의뢰서 작성</CardTitle>
//             <CardDescription>
//               아래 항목을 모두 입력해주세요. 입력된 내용은 BM 보고서 제작에 활용됩니다.
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-6">
//               <div className="space-y-2">
//                 <Label htmlFor="activityName">
//                   활동명 <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="activityName"
//                   placeholder="예: 뷰티크리에이터 김OO"
//                   value={formData.activityName}
//                   onChange={(e) =>
//                     setFormData({ ...formData, activityName: e.target.value })
//                   }
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="channelName">
//                   채널명 <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="channelName"
//                   placeholder="예: YouTube 링크 또는 Instagram 계정명"
//                   value={formData.channelName}
//                   onChange={(e) =>
//                     setFormData({ ...formData, channelName: e.target.value })
//                   }
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="productCategory">
//                   제품 카테고리 <span className="text-destructive">*</span>
//                 </Label>
//                 <Select
//                   value={formData.productCategory}
//                   onValueChange={(value) =>
//                     setFormData({ ...formData, productCategory: value })
//                   }
//                 >
//                   <SelectTrigger id="productCategory">
//                     <SelectValue placeholder="카테고리를 선택해주세요" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="skincare">스킨케어</SelectItem>
//                     <SelectItem value="makeup">메이크업</SelectItem>
//                     <SelectItem value="haircare">헤어케어</SelectItem>
//                     <SelectItem value="bodycare">바디케어</SelectItem>
//                     <SelectItem value="fragrance">향수</SelectItem>
//                     <SelectItem value="other">기타</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="brandConcept">
//                   브랜드 콘셉트 <span className="text-destructive">*</span>
//                 </Label>
//                 <Textarea
//                   id="brandConcept"
//                   placeholder="원하시는 브랜드 콘셉트나 방향성을 자유롭게 작성해주세요"
//                   value={formData.brandConcept}
//                   onChange={(e) =>
//                     setFormData({ ...formData, brandConcept: e.target.value })
//                   }
//                   rows={5}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="contact">
//                   소통 연락처 <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="contact"
//                   placeholder="예: 010-1234-5678"
//                   value={formData.contact}
//                   onChange={(e) =>
//                     setFormData({ ...formData, contact: e.target.value })
//                   }
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="email">
//                   이메일 <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="example@email.com"
//                   value={formData.email}
//                   onChange={(e) =>
//                     setFormData({ ...formData, email: e.target.value })
//                   }
//                 />
//               </div>

//               <Button type="submit" className="w-full" size="lg">
//                 제출하기
//               </Button>
//             </form>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
