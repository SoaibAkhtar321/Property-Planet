"use client";

// Site-wide fallback error boundary for any route without its own
// (properties, projects, places, blog, dashboard and admin have theirs).
import { RouteError } from "@/components/common/RouteStates";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
   return <RouteError error={error} reset={reset} />;
}
