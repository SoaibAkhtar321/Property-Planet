import { RouteLoading } from "@/components/common/RouteStates";

// Dashboard pages fetch per-user data on the server; without this, moving
// between dashboard pages showed the old page until the new one was ready.
export default function DashboardLoading() {
   return <RouteLoading label="Loading your dashboard…" />;
}
