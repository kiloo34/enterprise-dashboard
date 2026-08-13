"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";

interface TableauEmbedProps {
  src: string; // The URL of the Tableau view (e.g., https://prod-apnortheast-a.online.tableau.com/t/yoursite/views/Dashboard/View)
  width?: string;
  height?: string;
  hideTabs?: boolean;
}

export default function TableauEmbed({
  src,
  width = "100%",
  height = "800px",
  hideTabs = true,
}: TableauEmbedProps) {
  const [jwt, setJwt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const vizRef = useRef<any>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch("/api/analytics/tableau/token", {
          method: "GET",
          headers: {
            // Note: In Next.js, API proxy handles passing the IAM token
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch Tableau embed token.");
        }

        const data = await response.json();
        setJwt(data.token);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error loading Tableau integration.");
      }
    }

    fetchToken();
  }, []);

  if (error) {
    return <div className="p-4 text-red-500 bg-red-50 rounded-md">{error}</div>;
  }

  if (!jwt) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Connecting to Tableau SSO...</span>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden bg-white rounded-lg shadow-sm">
      {/* 
        The Tableau Embedding API v3 script must be loaded. 
        We use next/script to load it once. 
      */}
      <Script
        type="module"
        src="https://embedding.tableauusercontent.com/tableau.embedding.3.latest.min.js"
        strategy="afterInteractive"
      />

      {/* 
        Custom Web Component provided by Tableau.
        Using ts-ignore because React TypeScript definition doesn't know about custom elements by default 
      */}
      {/* @ts-ignore */}
      <tableau-viz
        ref={vizRef}
        id="tableauViz"
        src={src}
        token={jwt}
        toolbar="hidden"
        hide-tabs={hideTabs ? "true" : "false"}
        style={{ width, height }}
      >
      {/* @ts-ignore */}
      </tableau-viz>
    </div>
  );
}
