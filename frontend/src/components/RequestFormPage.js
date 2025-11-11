import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// -------------------------------------------------------
// src/components/RequestFormPage.tsx
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
const PLATFORM_OPTIONS = ["youtube", "instagram", "tiktok", "x", "etc"];
const CATEGORY_OPTIONS = [
    "skin_toner",
    "essence_serum_ampoule",
    "lotion",
    "cream",
    "mist_oil",
];
export function RequestFormPage({ onBack, onSubmit }) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Simple validation
        if (!formData.activityName || !formData.platform || !formData.channelName || !formData.productCategory || !formData.brandConcept || !formData.contact || !formData.email || !formData.viewPassword) {
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
                category_code: formData.productCategory,
                brand_concept: formData.brandConcept,
                contact_method: formData.contact,
                email: formData.email,
                view_pw: formData.viewPassword,
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
        }
        catch (err) {
            toast.error(err.message || "서버 오류가 발생했습니다.");
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-muted/20 py-12", children: _jsxs("div", { className: "container mx-auto px-6 max-w-3xl", children: [_jsxs(Button, { variant: "ghost", onClick: onBack, className: "mb-6", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "\uB3CC\uC544\uAC00\uAE30"] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "\uC758\uB8B0\uC11C \uC791\uC131" }), _jsx(CardDescription, { children: "\uC544\uB798 \uD56D\uBAA9\uC744 \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694. \uC785\uB825\uD558\uC2E0 \uB0B4\uC6A9\uC740 BM \uBCF4\uACE0\uC11C \uC791\uC131\uC5D0 \uD65C\uC6A9\uB429\uB2C8\uB2E4." })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "activityName", children: ["\uD65C\uB3D9\uBA85 ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsx(Input, { id: "activityName", placeholder: "\uC608) \uBDF0\uD2F0 \uD06C\uB9AC\uC5D0\uC774\uD130 \uAE40OO", value: formData.activityName, onChange: (e) => setFormData({ ...formData, activityName: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "platform", children: ["\uD50C\uB7AB\uD3FC ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsxs(Select, { value: formData.platform, onValueChange: (value) => setFormData({ ...formData, platform: value }), children: [_jsx(SelectTrigger, { id: "platform", children: _jsx(SelectValue, { placeholder: "\uD50C\uB7AB\uD3FC\uC744 \uC120\uD0DD\uD558\uC138\uC694" }) }), _jsx(SelectContent, { children: PLATFORM_OPTIONS.map((opt) => (_jsx(SelectItem, { value: opt, children: opt === "x" ? "X(트위터)" : opt.charAt(0).toUpperCase() + opt.slice(1) }, opt))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "channelName", children: ["\uCC44\uB110\uBA85 ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsx(Input, { id: "channelName", placeholder: "\uC608) YouTube \uB9C1\uD06C \uB610\uB294 Instagram \uACC4\uC815", value: formData.channelName, onChange: (e) => setFormData({ ...formData, channelName: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "productCategory", children: ["\uC81C\uD488 \uCE74\uD14C\uACE0\uB9AC ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsxs(Select, { value: formData.productCategory, onValueChange: (value) => setFormData({ ...formData, productCategory: value }), children: [_jsx(SelectTrigger, { id: "productCategory", children: _jsx(SelectValue, { placeholder: "\uCE74\uD14C\uACE0\uB9AC\uB97C \uC120\uD0DD\uD574\uC8FC\uC138\uC694" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "skin_toner", children: "\uC2A4\uD0A8/\uD1A0\uB108" }), _jsx(SelectItem, { value: "essence_serum_ampoule", children: "\uC5D0\uC13C\uC2A4/\uC138\uB7FC/\uC570\uD50C" }), _jsx(SelectItem, { value: "lotion", children: "\uB85C\uC158" }), _jsx(SelectItem, { value: "cream", children: "\uD06C\uB9BC" }), _jsx(SelectItem, { value: "mist_oil", children: "\uBBF8\uC2A4\uD2B8/\uC624\uC77C" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "brandConcept", children: ["\uBE0C\uB79C\uB4DC \uCF58\uC149\uD2B8 ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsx(Textarea, { id: "brandConcept", placeholder: "\uC6D0\uD558\uC2DC\uB294 \uBE0C\uB79C\uB4DC \uCF58\uC149\uD2B8\uB098 \uBC29\uD5A5\uC744 \uC790\uC720\uB86D\uAC8C \uC791\uC131\uD574\uC8FC\uC138\uC694", value: formData.brandConcept, onChange: (e) => setFormData({ ...formData, brandConcept: e.target.value }), rows: 5 })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "contact", children: ["\uC18C\uD1B5 \uC5F0\uB77D\uCC98 ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsx(Input, { id: "contact", placeholder: "\uC608) 010-1234-5678", value: formData.contact, onChange: (e) => setFormData({ ...formData, contact: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "email", children: ["\uC774\uBA54\uC77C ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsx(Input, { id: "email", type: "email", placeholder: "example@email.com", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "viewPassword", children: ["\uC5F4\uB78C \uBE44\uBC00\uBC88\uD638 ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsx(Input, { id: "viewPassword", type: "password", placeholder: "\uBCF4\uACE0\uC11C \uC5F4\uB78C\uC6A9 \uBE44\uBC00\uBC88\uD638 (\uCD5C\uC18C 4\uC790)", value: formData.viewPassword, onChange: (e) => setFormData({ ...formData, viewPassword: e.target.value }) })] }), _jsx(Button, { type: "submit", className: "w-full", size: "lg", disabled: submitting, children: submitting ? "제출 중..." : "제출하기" })] }) })] })] }) }));
}
