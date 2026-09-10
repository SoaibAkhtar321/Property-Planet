// propertyPlanetAIBus.ts
//
// Minimal, dependency-free pub/sub so any component (header CTA, hero link,
// suggested-question chip elsewhere on the site, etc.) can open the global
// Property Planet AI widget without needing to be a parent/child of it or wired
// through Redux. The widget itself is mounted once in src/layouts/Wrapper.tsx.

type Listener = (prefillQuestion?: string) => void;

const listeners = new Set<Listener>();

export const openPropertyPlanetAI = (prefillQuestion?: string): void => {
   listeners.forEach((listener) => listener(prefillQuestion));
};

export const onPropertyPlanetAIOpen = (listener: Listener): (() => void) => {
   listeners.add(listener);
   return () => listeners.delete(listener);
};
