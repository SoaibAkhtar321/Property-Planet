"use client";

import { RouteError } from "@/components/common/RouteStates";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
   return <RouteError error={error} reset={reset} title="We couldn't load this page" homeHref="/dashboard/dashboard-index" homeLabel="Back to dashboard" />;
}
