"use client"
import { Bar } from "react-chartjs-2";
import {
   Chart as ChartJS,
   CategoryScale,
   LinearScale,
   BarElement,
   Tooltip,
   Legend,
} from "chart.js";
import type { AdminOverviewMetrics } from "@/lib/admin/overview/queries";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CHART_OPTIONS = {
   responsive: true,
   maintainAspectRatio: false,
   plugins: { legend: { display: false } },
   scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } },
   },
};

interface AdminOverviewChartsProps {
   properties: AdminOverviewMetrics["properties"];
   leads: AdminOverviewMetrics["leads"];
}

// Both charts are driven entirely by the same counts already rendered in
// the stat cards above (getAdminOverviewMetrics()) — no separate/mock
// dataset. If every bucket is 0 the chart still renders (flat at zero),
// which is the honest representation of "no data yet".
const AdminOverviewCharts = ({ properties, leads }: AdminOverviewChartsProps) => {
   const propertyData = {
      labels: ["Published", "Pending", "Rejected", "Draft"],
      datasets: [
         {
            label: "Properties",
            data: [properties.published, properties.pending, properties.rejected, properties.draft],
            backgroundColor: "#1FAA59",
            borderRadius: 6,
            maxBarThickness: 48,
         },
      ],
   };

   const leadData = {
      labels: ["New", "Contacted", "Converted", "Closed"],
      datasets: [
         {
            label: "Leads",
            data: [leads.new, leads.contacted, leads.converted, leads.closed],
            backgroundColor: "#00B579",
            borderRadius: 6,
            maxBarThickness: 48,
         },
      ],
   };

   return (
      <div className="row">
         <div className="col-lg-6 mb-30">
            <div className="bg-white border-30 h-100" style={{ padding: 30 }}>
               <h5 className="mb-20">Property Pipeline</h5>
               <div style={{ height: 260 }}>
                  <Bar data={propertyData} options={CHART_OPTIONS} />
               </div>
            </div>
         </div>
         <div className="col-lg-6 mb-30">
            <div className="bg-white border-30 h-100" style={{ padding: 30 }}>
               <h5 className="mb-20">Lead Status</h5>
               <div style={{ height: 260 }}>
                  <Bar data={leadData} options={CHART_OPTIONS} />
               </div>
            </div>
         </div>
      </div>
   );
};

export default AdminOverviewCharts;