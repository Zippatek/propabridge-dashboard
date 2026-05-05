import { ListingWizard } from '@/components/agency/ListingWizard'

export const metadata = {
  title: 'Submit a listing — Propabridge Agency',
}

export default function NewListingPage() {
  return (
    <div className="py-8">
      <ListingWizard />
    </div>
  )
}
