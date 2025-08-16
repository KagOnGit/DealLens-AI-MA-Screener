import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MarketOverview } from '@/components/dashboard/MarketOverview'
import { DealActivity } from '@/components/dashboard/DealActivity'
import { TopCompanies } from '@/components/dashboard/TopCompanies'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'

export default function Home() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-2">
          <MarketOverview />
        </div>
        <div className="lg:col-span-2">
          <DealActivity />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TopCompanies />
        </div>
        <div>
          <AlertsPanel />
        </div>
      </div>
    </DashboardLayout>
  )
}
