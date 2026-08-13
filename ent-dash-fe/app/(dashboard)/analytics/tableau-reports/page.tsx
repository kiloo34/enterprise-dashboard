import { Metadata } from "next";
import TableauEmbed from "@/components/tableau/TableauEmbed";

export const metadata: Metadata = {
  title: "Tableau Reports | Enterprise Dashboard",
  description: "Interactive analytics dashboards embedded from Tableau Server",
};

export default function TableauReportsPage() {
  // Replace with the actual URL of a specific Tableau view you want to embed.
  const tableauViewUrl = process.env.NEXT_PUBLIC_TABLEAU_DEFAULT_VIEW || 
    "https://prod-apnortheast-a.online.tableau.com/t/yoursite/views/SampleDashboard/View";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tableau Reports</h1>
        <p className="text-muted-foreground">
          Live embedded analytics with Single Sign-On (SSO).
        </p>
      </div>
      
      <div className="mt-8 border rounded-lg bg-background shadow-sm p-4">
        <TableauEmbed src={tableauViewUrl} height="800px" />
      </div>
    </div>
  );
}
