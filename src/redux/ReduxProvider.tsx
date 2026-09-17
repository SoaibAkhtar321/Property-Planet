"use client";

// SEO fix: the Redux <Provider> is the only reason src/app/layout.tsx used
// to be a Client Component ('use client'). A Client Component root layout
// cannot export Next's `metadata`/`metadataBase`, which is why the app
// fell back to hand-written <head> tags duplicated on every page (see the
// audit). Isolating the Provider here lets the root layout go back to
// being a Server Component while everything that actually needs Redux
// still gets it, unchanged.

import { Provider } from "react-redux";
import store from "@/redux/store";

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
   return <Provider store={store}>{children}</Provider>;
}
