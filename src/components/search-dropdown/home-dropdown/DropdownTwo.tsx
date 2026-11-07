"use client"
import { useState } from "react";
import NiceSelect from "@/ui/NiceSelect";

// Homepage hero search.
//  * Every field now feeds the /properties URL (previously the button just
//    opened /properties and ignored what the visitor had chosen).
//  * Mobile (< 768px): only the keyword box + search button show; the other
//    filters sit behind a compact "Filters" toggle so the card doesn't fill
//    the whole first screen. Desktop/tablet layout is unchanged.

type Opt = { value: string; text: string };

const ANY: Opt = { value: "", text: "Any" };

const TABS: {
   title: string;
   firstLabel: string;
   firstParam: "propertyType" | "q";
   firstOptions: Opt[];
   locations: Opt[];
   keywordPlaceholder: string;
   budgets: (Opt & { min?: number; max?: number })[];
}[] = [
   {
      title: "Buy",
      firstLabel: "Property Type",
      firstParam: "propertyType",
      firstOptions: [
         ANY,
         { value: "land", text: "Land" },
         { value: "plot", text: "Plot" },
         { value: "villa", text: "Villa" },
         { value: "apartment", text: "Apartment" },
         { value: "commercial", text: "Commercial" },
      ],
      locations: [
         ANY,
         { value: "Future City", text: "Future City" },
         { value: "Mucherla", text: "Mucherla" },
         { value: "Maheshwaram", text: "Maheshwaram" },
         { value: "Shamshabad", text: "Shamshabad" },
         { value: "Adibatla", text: "Adibatla" },
         { value: "Shankarpally", text: "Shankarpally" },
         { value: "Kollur", text: "Kollur" },
      ],
      keywordPlaceholder: "plot, land, villa, apartment",
      budgets: [
         ANY,
         { value: "1", text: "₹20 Lakh - ₹50 Lakh", min: 2000000, max: 5000000 },
         { value: "2", text: "₹50 Lakh - ₹1 Crore", min: 5000000, max: 10000000 },
         { value: "3", text: "₹1 Crore - ₹5 Crore", min: 10000000, max: 50000000 },
      ],
   },
   {
      title: "Corporate",
      firstLabel: "Purpose",
      firstParam: "q",
      firstOptions: [
         ANY,
         { value: "logistics", text: "Logistics / Warehousing" },
         { value: "development", text: "Development" },
         { value: "land", text: "Land Aggregation" },
         { value: "commercial", text: "Commercial" },
         { value: "institutional", text: "Institutional Investment" },
      ],
      locations: [
         ANY,
         { value: "Future City", text: "Future City" },
         { value: "Adibatla", text: "Adibatla — NH-44" },
         { value: "Kandukur", text: "Kandukur" },
         { value: "Kadthal", text: "Kadthal" },
         { value: "Farooqnagar", text: "Farooqnagar" },
         { value: "Bongloor", text: "Bongloor" },
         { value: "Ibrahimpatnam", text: "Ibrahimpatnam" },
      ],
      keywordPlaceholder: "acres, corporate land, corridor",
      budgets: [
         ANY,
         { value: "1", text: "₹1 Crore - ₹10 Crore", min: 10000000, max: 100000000 },
         { value: "2", text: "₹10 Crore - ₹50 Crore", min: 100000000, max: 500000000 },
         { value: "3", text: "₹50 Crore +", min: 500000000 },
      ],
   },
];

const DropdownTwo = () => {
   const [activeTab, setActiveTab] = useState(0);
   const [filtersOpen, setFiltersOpen] = useState(false);
   const [first, setFirst] = useState("");
   const [location, setLocation] = useState("");
   const [keyword, setKeyword] = useState("");
   const [budget, setBudget] = useState("");

   const tab = TABS[activeTab];
   const activeCount = [first, location, budget].filter(Boolean).length;

   const switchTab = (index: number) => {
      setActiveTab(index);
      setFirst("");
      setLocation("");
      setBudget("");
   };

   const search = () => {
      const params = new URLSearchParams();
      const words = [keyword.trim(), tab.firstParam === "q" ? first : ""].filter(Boolean).join(" ");
      if (words) params.set("q", words);
      if (tab.firstParam === "propertyType" && first) params.set("propertyType", first);
      if (location) params.set("locality", location);
      const b = tab.budgets.find((o) => o.value === budget && o.value);
      if (b?.min) params.set("minPrice", String(b.min));
      if (b?.max) params.set("maxPrice", String(b.max));
      const qs = params.toString();
      window.location.href = qs ? `/properties?${qs}` : "/properties";
   };

   return (
      <div className={`search-wrapper-one layout-two mt-60 lg-mt-40 position-relative pp-hero-search ${filtersOpen ? "pp-hs-open" : ""}`}>
         <nav className="search-filter-nav-one d-flex">
            <div className="nav nav-tabs border-0" role="tablist">
               {TABS.map((t, index) => (
                  <button key={t.title} onClick={() => switchTab(index)} className={`nav-link ${activeTab === index ? "active" : ""}`} type="button" role="tab" aria-selected={activeTab === index}>{t.title}</button>
               ))}
            </div>
         </nav>

         <div className="bg-wrapper border-0 rounded-0">
            <form key={activeTab} onSubmit={(e) => { e.preventDefault(); search(); }}>
               <div className="row gx-0 align-items-center">
                  <div className="col-xl-2 col-md-6 pp-hs-filter">
                     <div className="input-box-one border-left">
                        <div className="label">{tab.firstLabel}</div>
                        <NiceSelect className="nice-select fw-normal" options={tab.firstOptions} defaultCurrent={0}
                           onChange={(e) => setFirst(e.target.value)} name="" placeholder="" />
                     </div>
                  </div>
                  <div className="col-xl-2 col-md-6 pp-hs-filter">
                     <div className="input-box-one border-left">
                        <div className="label">Location</div>
                        <NiceSelect className="nice-select location fw-normal" options={tab.locations} defaultCurrent={0}
                           onChange={(e) => setLocation(e.target.value)} name="" placeholder="" />
                     </div>
                  </div>
                  <div className="col-xl-4 col-md-6 pp-hs-keyword">
                     <div className="input-box-one border-left">
                        <div className="label">Keyword</div>
                        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
                           placeholder={tab.keywordPlaceholder} className="type-input" aria-label="Keyword" />
                     </div>
                  </div>
                  <div className="col-xl-3 col-md-6 pp-hs-filter">
                     <div className="input-box-one border-left">
                        <div className="label">Budget</div>
                        <NiceSelect className="nice-select fw-normal" options={tab.budgets} defaultCurrent={0}
                           onChange={(e) => setBudget(e.target.value)} name="" placeholder="" />
                     </div>
                  </div>
                  <div className="col-xl-1 pp-hs-actions">
                     <button type="button" className="pp-hs-toggle" aria-expanded={filtersOpen}
                        onClick={() => setFiltersOpen((v) => !v)}>
                        <i className="bi bi-sliders" aria-hidden="true"></i>
                        <span>Filters{activeCount ? ` (${activeCount})` : ""}</span>
                     </button>
                     <div className="input-box-one lg-mt-10">
                        <button type="submit" className="fw-500 text-uppercase tran3s search-btn-two" aria-label="Search properties">
                           <i className="fa-light fa-magnifying-glass"></i>
                        </button>
                     </div>
                  </div>
               </div>
            </form>
         </div>
      </div>
   )
}

export default DropdownTwo
