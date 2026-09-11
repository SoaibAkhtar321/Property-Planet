"use client"
import { useState } from "react";
import NiceSelect from "@/ui/NiceSelect";

const tab_title: string[] = ["Buy", "Corporate",];

const DropdownTwo = () => {

   const selectHandler = (e: any) => { };
   const [activeTab, setActiveTab] = useState(0);

   const handleTabClick = (index: any) => {
      setActiveTab(index);
   };

   const searchHandler = () => {
      window.location.href = '/properties';
   };

   return (
      <div className="search-wrapper-one layout-two mt-60 lg-mt-40 position-relative">
         <nav className="search-filter-nav-one d-flex">
            <div className="nav nav-tabs border-0" role="tablist">
               {tab_title.map((tab, index) => (
                  <button key={index} onClick={() => handleTabClick(index)} className={`nav-link ${activeTab === index ? "active" : ""}`} id="buy-tab" type="button">{tab}</button>
               ))}
            </div>
         </nav>

         <div className="bg-wrapper border-0 rounded-0">
            <div className="tab-content">
               <div className={`tab-pane show ${activeTab === 0 ? "active" : ""}`} id="buy">
                  <form onSubmit={(e) => { e.preventDefault(); searchHandler(); }}>
                     <div className="row gx-0 align-items-center">
                        <div className="col-xl-2 col-md-6">
                           <div className="input-box-one border-left">
                              <div className="label">Property Type</div>
                              <NiceSelect className="nice-select fw-normal"
                                 options={[
                                    { value: "land", text: "Land" },
                                    { value: "plot", text: "Plot" },
                                    { value: "villa", text: "Villa" },
                                    { value: "apartment", text: "Apartment" },
                                    { value: "commercial", text: "Commercial" },
                                 ]}
                                 defaultCurrent={0}
                                 onChange={selectHandler}
                                 name=""
                                 placeholder="" />
                           </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                           <div className="input-box-one border-left">
                              <div className="label">Location</div>
                              <NiceSelect className="nice-select location fw-normal"
                                 options={[
                                    { value: "future_city", text: "Future City" },
                                    { value: "mucherla", text: "Mucherla" },
                                    { value: "maheshwaram", text: "Maheshwaram" },
                                    { value: "shamshabad", text: "Shamshabad" },
                                    { value: "adibatla", text: "Adibatla" },
                                    { value: "shankarpally", text: "Shankarpally" },
                                    { value: "kollur", text: "Kollur" },
                                 ]}
                                 defaultCurrent={0}
                                 onChange={selectHandler}
                                 name=""
                                 placeholder="" />
                           </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                           <div className="input-box-one border-left">
                              <div className="label">Keyword</div>
                              <input type="text" placeholder="plot, land, villa, apartment" className="type-input" />
                           </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                           <div className="input-box-one border-left">
                              <div className="label">Budget</div>
                              <NiceSelect
                                 className="nice-select fw-normal"
                                 options={[
                                    { value: "1", text: "₹20 Lakh - ₹50 Lakh" },
                                    { value: "2", text: "₹50 Lakh - ₹1 Crore" },
                                    { value: "3", text: "₹1 Crore - ₹5 Crore" },
                                 ]}
                                 defaultCurrent={0}
                                 onChange={selectHandler}
                                 name=""
                                 placeholder="" />
                           </div>
                        </div>
                        <div className="col-xl-1">
                           <div className="input-box-one lg-mt-10">
                              <button className="fw-500 text-uppercase tran3s search-btn-two"><i
                                 className="fa-light fa-magnifying-glass"></i></button>
                           </div>
                        </div>
                     </div>
                  </form>
               </div>

               <div className={`tab-pane show ${activeTab === 1 ? "active" : ""}`} id="buy">
                  <form onSubmit={(e) => { e.preventDefault(); searchHandler(); }}>
                     <div className="row gx-0 align-items-center">
                        <div className="col-xl-2 col-md-6">
                           <div className="input-box-one border-left">
                              <div className="label">Purpose</div>
                              <NiceSelect className="nice-select fw-normal"
                                 options={[
                                    { value: "logistics", text: "Logistics / Warehousing" },
                                    { value: "development", text: "Development" },
                                    { value: "land_aggregation", text: "Land Aggregation" },
                                    { value: "commercial", text: "Commercial" },
                                    { value: "institutional", text: "Institutional Investment" },
                                 ]}
                                 defaultCurrent={0}
                                 onChange={selectHandler}
                                 name=""
                                 placeholder="" />
                           </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                           <div className="input-box-one border-left">
                              <div className="label">Location</div>
                              <NiceSelect className="nice-select location fw-normal"
                                 options={[
                                    { value: "future_city", text: "Future City" },
                                    { value: "adibatla", text: "Adibatla — NH-44" },
                                    { value: "kandukur", text: "Kandukur" },
                                    { value: "kadthal", text: "Kadthal" },
                                    { value: "farooqnagar", text: "Farooqnagar" },
                                    { value: "bongloor", text: "Bongloor" },
                                    { value: "ibrahimpatnam", text: "Ibrahimpatnam" },
                                 ]}
                                 defaultCurrent={0}
                                 onChange={selectHandler}
                                 name=""
                                 placeholder="" />
                           </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                           <div className="input-box-one border-left">
                              <div className="label">Keyword</div>
                              <input type="text" placeholder="acres, corporate land, corridor" className="type-input" />
                           </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                           <div className="input-box-one border-left">
                              <div className="label">Budget</div>
                              <NiceSelect
                                 className="nice-select fw-normal"
                                 options={[
                                    { value: "1", text: "₹1 Crore - ₹10 Crore" },
                                    { value: "2", text: "₹10 Crore - ₹50 Crore" },
                                    { value: "3", text: "₹50 Crore +" },
                                 ]}
                                 defaultCurrent={0}
                                 onChange={selectHandler}
                                 name=""
                                 placeholder="" />
                           </div>
                        </div>
                        <div className="col-xl-1">
                           <div className="input-box-one lg-mt-10">
                              <button className="fw-500 text-uppercase tran3s search-btn-two"><i
                                 className="fa-light fa-magnifying-glass"></i></button>
                           </div>
                        </div>
                     </div>
                  </form>
               </div>
            </div>
         </div>
      </div>
   )
}

export default DropdownTwo
