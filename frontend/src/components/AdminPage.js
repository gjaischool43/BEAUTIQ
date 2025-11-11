import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/AdminPage.tsx
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle, } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "./ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Eye } from "lucide-react";
export function AdminPage({ onBack, submissions }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const handleLogin = (e) => {
        e.preventDefault();
        if (username === "admin" && password === "admin") {
            setIsLoggedIn(true);
            toast.success("로그인 성공");
        }
        else {
            toast.error("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
    };
    const handleViewDetail = (submission) => {
        setSelectedSubmission(submission);
        setIsDetailOpen(true);
    };
    const getCategoryLabel = (category) => {
        const labels = {
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
        return (_jsx("div", { className: "min-h-screen bg-muted/20 flex items-center justify-center py-12", children: _jsxs("div", { className: "container mx-auto px-6 max-w-md", children: [_jsxs(Button, { variant: "ghost", onClick: onBack, className: "mb-6", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "\uB3CC\uC544\uAC00\uAE30"] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778" }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "username", children: "\uC544\uC774\uB514" }), _jsx(Input, { id: "username", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uC138\uC694" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "\uBE44\uBC00\uBC88\uD638" }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694" })] }), _jsx(Button, { type: "submit", className: "w-full", children: "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778" }), _jsx("p", { className: "text-sm text-muted-foreground text-center mt-4", children: "Demo \uACC4\uC815: admin / admin" })] }) })] })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-muted/20 py-12", children: _jsxs("div", { className: "container mx-auto px-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Button, { variant: "ghost", onClick: onBack, children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "\uB3CC\uC544\uAC00\uAE30"] }), _jsx("h1", { children: "\uC758\uB8B0\uC11C \uAD00\uB9AC \uD398\uC774\uC9C0" })] }), _jsx(Button, { variant: "outline", onClick: () => {
                                setIsLoggedIn(false);
                                setUsername("");
                                setPassword("");
                            }, children: "\uB85C\uADF8\uC544\uC6C3" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\uC811\uC218\uB41C \uC758\uB8B0 \uBAA9\uB85D" }) }), _jsx(CardContent, { children: submissions.length === 0 ? (_jsx("div", { className: "text-center py-12 text-muted-foreground", children: "\uC544\uC9C1 \uC811\uC218\uB41C \uC758\uB8B0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "\uD65C\uB3D9\uBA85" }), _jsx(TableHead, { children: "\uCC44\uB110\uBA85" }), _jsx(TableHead, { children: "\uC81C\uD488 \uCE74\uD14C\uACE0\uB9AC" }), _jsx(TableHead, { children: "\uC5F0\uB77D\uCC98" }), _jsx(TableHead, { children: "\uC774\uBA54\uC77C" }), _jsx(TableHead, { className: "text-right", children: "\uC561\uC158" })] }) }), _jsx(TableBody, { children: submissions.map((s, i) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: s.activityName }), _jsx(TableCell, { className: "max-w-[200px] truncate", children: s.channelName }), _jsx(TableCell, { children: getCategoryLabel(s.productCategory) }), _jsx(TableCell, { children: s.contact }), _jsx(TableCell, { children: s.email }), _jsx(TableCell, { className: "text-right", children: _jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleViewDetail(s), children: [_jsx(Eye, { className: "w-4 h-4 mr-2" }), " \uBCF4\uAE30"] }) })] }, i))) })] }) })) })] }), _jsx(Dialog, { open: isDetailOpen, onOpenChange: setIsDetailOpen, children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "\uC758\uB8B0\uC11C \uC0C1\uC138 \uC815\uBCF4" }) }), selectedSubmission && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "\uD65C\uB3D9\uBA85" }), _jsx("p", { className: "mt-1", children: selectedSubmission.activityName })] }), _jsxs("div", { children: [_jsx(Label, { children: "\uCC44\uB110\uBA85" }), _jsx("p", { className: "mt-1", children: selectedSubmission.channelName })] }), _jsxs("div", { children: [_jsx(Label, { children: "\uC81C\uD488 \uCE74\uD14C\uACE0\uB9AC" }), _jsx("p", { className: "mt-1", children: getCategoryLabel(selectedSubmission.productCategory) })] }), _jsxs("div", { children: [_jsx(Label, { children: "\uBE0C\uB79C\uB4DC \uCF58\uC149\uD2B8" }), _jsx("p", { className: "mt-1 whitespace-pre-wrap", children: selectedSubmission.brandConcept })] }), _jsxs("div", { children: [_jsx(Label, { children: "\uC5F0\uB77D\uCC98" }), _jsx("p", { className: "mt-1", children: selectedSubmission.contact })] }), _jsxs("div", { children: [_jsx(Label, { children: "\uC774\uBA54\uC77C" }), _jsx("p", { className: "mt-1", children: selectedSubmission.email })] })] }))] }) })] }) }));
}
