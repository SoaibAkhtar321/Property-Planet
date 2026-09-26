"use client"
import Image from "next/image"
import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo"

import icon_1 from "@/assets/images/dashboard/icon/icon_12.svg"
import icon_2 from "@/assets/images/dashboard/icon/icon_13.svg"
import icon_3 from "@/assets/images/dashboard/icon/icon_14.svg"
import icon_4 from "@/assets/images/dashboard/icon/icon_15.svg"
import type { DashboardStat } from "@/lib/dashboard/queries"

// Cycled by position rather than mapped 1:1, since the stat list is now
// real and role-dependent (2 cards for a buyer, 6 for a seller) instead
// of a fixed hardcoded 4.
const card_icons = [icon_1, icon_2, icon_3, icon_4];

interface DashboardBodyProps {
   stats: DashboardStat[];
}

const DashboardBody = ({ stats }: DashboardBodyProps) => {

   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Dashboard" />

            <h2 className="main-title d-block d-lg-none">Dashboard</h2>
            <div className="row">
               {stats.map((item, index) => (
                  <div key={item.id} className="col-lg-3 col-6">
                     <div className={`dash-card-one bg-white border-30 position-relative mb-15 ${index === 0 ? "skew-none" : ""}`}>
                        <div className="d-sm-flex align-items-center justify-content-between">
                           <div className="icon rounded-circle d-flex align-items-center justify-content-center order-sm-1"><Image src={card_icons[index % card_icons.length]} alt="" className="lazy-img" /></div>
                           <div className="order-sm-0">
                              <span>{item.title}</span>
                              <div className="value fw-500">{item.value}</div>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   )
}

export default DashboardBody
