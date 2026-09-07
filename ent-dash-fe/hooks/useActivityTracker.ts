import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export function useActivityTracker() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    // Only track authenticated users
    if (!user?.accessToken || !pathname) return;

    const trackPageVisit = async () => {
      try {
        await fetch("/api/audit-logs/activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`
          },
          body: JSON.stringify({
            action: "PAGE_VIEW",
            target_type: "PAGE",
            endpoint: pathname,
            user_agent: window.navigator.userAgent,
            method: "GET",
          })
        });
      } catch (e) {
        // Silent fail for tracking to not interrupt user experience
        console.warn("Audit tracking failed:", e);
      }
    };

    trackPageVisit();
  }, [pathname, user?.accessToken]);
}
