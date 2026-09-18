// bootstrap/dist/js/bootstrap ships no type declarations of its own (it's
// the plain, non-ESM UMD bundle, not the `bootstrap` package's typed
// entry point). It was previously loaded with an untyped `require()`,
// which TypeScript doesn't check; src/layouts/Wrapper.tsx now loads it
// via `import("bootstrap/dist/js/bootstrap")` (see the perf comment
// there), which does get resolved -- so it needs the same kind of ambient
// declaration wowjs.d.ts already provides for its own dynamic import.
declare module "bootstrap/dist/js/bootstrap";
