// src/components/ui/sidebar.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { PanelLeft as PanelLeftIcon } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "./tooltip";
const SidebarContext = React.createContext(null);
export function useSidebar() {
    const ctx = React.useContext(SidebarContext);
    if (!ctx)
        throw new Error("useSidebar must be used within SidebarProvider");
    return ctx;
}
function useIsMobile() {
    const [mobile, setMobile] = React.useState(false);
    React.useEffect(() => {
        const mql = window.matchMedia("(max-width: 768px)");
        const onChange = () => setMobile(mql.matches);
        onChange();
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);
    return mobile;
}
export function SidebarProvider({ defaultOpen = true, children, className, style, ...props }) {
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(defaultOpen);
    const state = open ? "expanded" : "collapsed";
    const toggleSidebar = React.useCallback(() => setOpen((v) => !v), [setOpen]);
    const value = React.useMemo(() => ({ state, open, setOpen, isMobile, toggleSidebar }), [state, open, isMobile, toggleSidebar]);
    return (_jsx(SidebarContext.Provider, { value: value, children: _jsx(TooltipProvider, { delayDuration: 0, children: _jsx("div", { "data-slot": "sidebar-wrapper", style: {
                    "--sidebar-width": "16rem",
                }, className: [
                    "flex min-h-svh w-full bg-background text-foreground",
                    className,
                ].join(" "), ...props, children: children }) }) }));
}
export function Sidebar({ className, children, ...props }) {
    const { state } = useSidebar();
    return (_jsx("div", { "data-slot": "sidebar", "data-state": state, className: [
            "hidden md:block",
            "h-svh w-[var(--sidebar-width)] border-r bg-card",
            className,
        ].join(" "), ...props, children: _jsx("div", { className: "flex h-full w-full flex-col", children: children }) }));
}
export function SidebarTrigger({ className, onClick, ...props }) {
    const { toggleSidebar } = useSidebar();
    return (_jsxs(Button, { variant: "ghost", size: "icon", className: ["size-7", className].join(" "), onClick: (e) => {
            onClick?.(e);
            toggleSidebar();
        }, ...props, children: [_jsx(PanelLeftIcon, {}), _jsx("span", { className: "sr-only", children: "Toggle Sidebar" })] }));
}
export function SidebarInset({ className, ...props }) {
    return (_jsx("main", { "data-slot": "sidebar-inset", className: ["relative flex w-full flex-1 flex-col", className].join(" "), ...props }));
}
export function SidebarHeader({ className, ...props }) {
    return (_jsx("div", { "data-slot": "sidebar-header", className: ["flex flex-col gap-2 p-2", className].join(" "), ...props }));
}
export function SidebarFooter({ className, ...props }) {
    return (_jsx("div", { "data-slot": "sidebar-footer", className: ["flex flex-col gap-2 p-2", className].join(" "), ...props }));
}
export function SidebarSeparator({ className, ...props }) {
    return (_jsx(Separator, { className: ["mx-2 w-auto", className].join(" "), ...props }));
}
export function SidebarContent({ className, ...props }) {
    return (_jsx("div", { "data-slot": "sidebar-content", className: ["flex min-h-0 flex-1 flex-col gap-2 overflow-auto", className].join(" "), ...props }));
}
export function SidebarInput({ className, ...props }) {
    return (_jsx(Input, { className: ["h-8 w-full shadow-none", className].join(" "), ...props }));
}
export function SidebarGroup({ className, ...props }) {
    return (_jsx("div", { "data-slot": "sidebar-group", className: ["relative flex w-full min-w-0 flex-col p-2", className].join(" "), ...props }));
}
export function SidebarGroupLabel({ className, asChild = false, ...props }) {
    const Comp = asChild ? Slot : "div";
    return (_jsx(Comp, { "data-slot": "sidebar-group-label", className: [
            "flex h-8 items-center rounded-md px-2 text-xs font-medium text-muted-foreground",
            className,
        ].join(" "), ...props }));
}
const sidebarMenuButtonVariants = cva("flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground [&>svg]:size-4", {
    variants: {
        variant: { default: "", outline: "border bg-background shadow-sm" },
        size: { default: "h-8 text-sm", sm: "h-7 text-xs", lg: "h-12 text-sm" },
    },
    defaultVariants: { variant: "default", size: "default" },
});
export function SidebarMenuButton({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }) {
    const Comp = asChild ? Slot : "button";
    const button = (_jsx(Comp, { "data-active": isActive, className: [sidebarMenuButtonVariants({ variant, size }), className].join(" "), ...props }));
    if (!tooltip)
        return button;
    const tipProps = typeof tooltip === "string" ? { children: tooltip } : tooltip;
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: button }), _jsx(TooltipContent, { side: "right", align: "center", ...tipProps })] }));
}
export function SidebarMenu({ className, ...props }) {
    return (_jsx("ul", { className: ["flex w-full min-w-0 flex-col gap-1", className].join(" "), ...props }));
}
export function SidebarMenuItem({ className, ...props }) {
    return (_jsx("li", { className: ["group relative", className].join(" "), ...props }));
}
export function SidebarMenuAction({ className, asChild = false, ...props }) {
    const Comp = asChild ? Slot : "button";
    return (_jsx(Comp, { className: [
            "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            className,
        ].join(" "), ...props }));
}
export function SidebarMenuBadge({ className, ...props }) {
    return (_jsx("div", { className: [
            "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-muted-foreground",
            className,
        ].join(" "), ...props }));
}
export function SidebarMenuSub({ className, ...props }) {
    return (_jsx("ul", { className: [
            "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
            className,
        ].join(" "), ...props }));
}
export function SidebarMenuSubItem({ className, ...props }) {
    return _jsx("li", { className: ["relative", className].join(" "), ...props });
}
export function SidebarMenuSubButton({ asChild = false, size = "md", isActive = false, className, ...props }) {
    const Comp = asChild ? Slot : "a";
    return (_jsx(Comp, { "data-active": isActive, "data-size": size, className: [
            "flex h-7 items-center gap-2 overflow-hidden rounded-md px-2 text-sm hover:bg-accent hover:text-accent-foreground [&>svg]:size-4",
            isActive && "bg-accent text-accent-foreground",
            size === "sm" ? "text-xs" : "text-sm",
            className,
        ].join(" "), ...props }));
}
