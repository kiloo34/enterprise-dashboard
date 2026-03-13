"use client";

import { useEffect } from "react";

export default function ErrorTestPage() {
    useEffect(() => {
        throw new Error("This is a deliberate test error thrown by the Antigravity system to verify the Global Error Boundary.");
    }, []);

    return <div>If you see this, the error boundary failed to catch the error.</div>;
}
