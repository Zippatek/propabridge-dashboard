import { Suspense } from 'react'
import { AgencyLoginForm } from '@/components/agency/AgencyLoginForm'
import { AgencyWelcomePanel } from '@/components/agency/AgencyWelcomePanel'

export const metadata = {
  title: 'Propabridge Agency — Sign In',
  description: 'Agency partner portal — manage your portfolio, leads, and commissions.',
}

export default function AgencyLoginPage() {
  return (
    <div className="min-h-screen flex">
      <AgencyWelcomePanel />

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <Suspense>
          <AgencyLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
