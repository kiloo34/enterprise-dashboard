"use client";

"use client";
import React, { useState } from "react";
import { Sidebar } from "./Sidebar/Sidebar";
import { Header } from "./Header/Header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex h-screen relative overflow-hidden transition-colors" style={{ background: 'var(--page-bg)' }}>
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
