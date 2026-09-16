import { Property } from "./types";

// IMPORTANT: These are development/demo records used only to exercise the
// canonical /properties layout during Phase 3. They are NOT confirmed
// Property Planet inventory. Every record is flagged `isDemo: true` and the
// UI must surface that flag rather than presenting these as real listings.
// Phase 4 replaces this file with a Supabase-backed query against
// `properties` / `property_location` / `property_media`.

const demoProperties: Property[] = [
   {
      id: "demo-1",
      slug: "kongara-khurd-plot-1",
      title: "Residential Plot, Kongara Khurd-A",
      tag: "Plot",
      listingType: "Sale",
      propertyType: "Plot",
      address: "Kongara Khurd-A, South Hyderabad",
      price: 3500000,
      sqft: 2000,
      images: [
         "/assets/images/listing/img_01.jpg",
         "/assets/images/listing/img_02.jpg",
         "/assets/images/listing/img_03.jpg",
         "/assets/images/listing/img_04.jpg",
      ],
      overview:
         "A sample plot record used to demonstrate the canonical listing layout while real inventory data is finalized.",
      overviewItems: [
         { label: "Area", value: "2,000 sqft" },
         { label: "Type", value: "Plot" },
         { label: "Facing", value: "East" },
      ],
      amenities: ["Gated Layout", "Wide Roads", "Underground Drainage"],
      nearby: [
         { title: "Main Road", distance: "0.5km" },
         { title: "School", distance: "2.1km" },
      ],
      isDemo: true,
   },
   {
      id: "demo-2",
      slug: "future-city-villa-1",
      title: "3BHK Independent Villa, Future City Corridor",
      tag: "Villa",
      listingType: "Sale",
      propertyType: "Villa",
      address: "Future City Corridor, Hyderabad",
      price: 9800000,
      sqft: 2600,
      bed: 3,
      bath: 3,
      images: [
         "/assets/images/listing/img_05.jpg",
         "/assets/images/listing/img_06.jpg",
         "/assets/images/listing/img_07.jpg",
      ],
      overview:
         "A sample villa record used to demonstrate the canonical listing layout while real inventory data is finalized.",
      overviewItems: [
         { label: "Sqft", value: "2,600" },
         { label: "Bed", value: "3" },
         { label: "Bath", value: "3" },
         { label: "Type", value: "Villa" },
      ],
      amenities: ["Car Parking", "Garden", "Power Backup"],
      nearby: [
         { title: "Hospital", distance: "1.7km" },
         { title: "Metro Station", distance: "3.4km" },
      ],
      isDemo: true,
   },
   {
      id: "demo-3",
      slug: "hyderabad-apartment-1",
      title: "2BHK Apartment, Hyderabad Growth Corridor",
      tag: "Apartment",
      listingType: "Sale",
      propertyType: "Apartment",
      address: "Hyderabad Growth Corridor",
      price: 22000,
      priceUnit: "/mo",
      sqft: 1150,
      bed: 2,
      bath: 2,
      images: [
         "/assets/images/listing/img_08.jpg",
         "/assets/images/listing/img_09.jpg",
      ],
      overview:
         "A sample apartment record used to demonstrate the canonical listing layout while real inventory data is finalized.",
      overviewItems: [
         { label: "Sqft", value: "1,150" },
         { label: "Bed", value: "2" },
         { label: "Bath", value: "2" },
         { label: "Type", value: "Apartment" },
      ],
      amenities: ["Lift", "Security", "Parking"],
      isDemo: true,
   },
];

export default demoProperties;
