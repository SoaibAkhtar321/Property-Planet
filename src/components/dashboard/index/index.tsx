import DashboardBody from "./DashboardBody"
import type { DashboardStat } from "@/lib/dashboard/queries"

interface DashboardIndexProps {
  stats: DashboardStat[];
}

const DashboardIndex = ({ stats }: DashboardIndexProps) => {
  return (
    <>
      <DashboardBody stats={stats} />
    </>
  )
}

export default DashboardIndex
