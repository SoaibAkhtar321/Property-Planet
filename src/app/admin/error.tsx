"use client";

import { RouteError } from "@/components/common/RouteStates";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
   return <RouteError error={error} reset={reset} title="This admin page couldn't load" homeHref="/admin" homeLabel="Back to admin" />;
}
