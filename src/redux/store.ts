import { configureStore } from '@reduxjs/toolkit'

// Launch-audit Stage 8 (H5): `properties` used to be backed by
// propertySlice.ts, which held nothing but the old lorem-ipsum template's
// ListingData.ts as its initial state — fabricated placeholder listings
// (fake ids/prices/titles) with no real Property Planet data behind them.
// It has been deleted, along with its only consumer (src/hooks/UseProperty.ts,
// which had zero remaining call sites) and ListingData.ts itself (which had
// no other importer). Confirmed dead before removal: grepped for every
// selector/action it exported (selectProperties, selectProperty,
// single_property, propertySlice) and for RootState/state.properties
// anywhere else in src/ — no other usage existed.
//
// The store and <Provider> (ReduxProvider.tsx) are kept even with no
// reducers: layout.tsx relies on ReduxProvider being a Client Component so
// the root layout itself can stay a Server Component (see ReduxProvider.tsx's
// own comment) — removing the Provider is a separate, larger change than
// this cleanup pass, not something to fold in here.
const store = configureStore({
   reducer: {},
   middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: false
   }),
})

export type RootState = ReturnType<typeof store.getState>;

export default store;