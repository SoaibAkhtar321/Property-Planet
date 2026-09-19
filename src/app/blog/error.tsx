"use client";

import { RouteError } from "@/components/common/RouteStates";

export default function BlogError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
   return <RouteError error={error} reset={reset} title="We couldn't load this article" homeHref="/blog" homeLabel="Back to insights" />;
}
