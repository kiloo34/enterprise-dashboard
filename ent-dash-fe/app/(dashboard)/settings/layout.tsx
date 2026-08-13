"use client";

import React from "react";
import { SettingsNav } from "./components/SettingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-6 lg:p-8 w-full">
            <div className="flex flex-col md:flex-row gap-8 items-start w-full">

                {/* Left: nav card — fixed width, floating */}
                <div
                    className="w-full md:w-52 shrink-0 md:sticky md:top-8 rounded-2xl border overflow-hidden"
                    style={{
                        background: "var(--card-bg)",
                        borderColor: "var(--card-border)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                >
                    <SettingsNav />
                </div>

                {/* Right: content — full remaining width, no wrapper */}
                <div className="flex-1 min-w-0 w-full">
                    {children}
                </div>

            </div>
        </div>
    );
}
