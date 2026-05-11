'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPropertyById, updateProperty, Property } from '@/lib/mock-data'
import { PropertyForm } from '@/components/dashboard/PropertyForm' // Assuming a reusable form

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProperty = () => {
      try {
        const prop = getPropertyById(params.id)
        if (prop) {
          setProperty(prop)
        } else {
          setError('Property not found.')
        }
      } catch (err) {
        setError('Failed to fetch property.')
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [params.id])

  const handleSubmit = (updatedProperty: Property) => {
    try {
      updateProperty(updatedProperty.id, updatedProperty)
      router.push(`/admin/audit`) // Redirect to audit page after edit
    } catch (err) {
      setError('Failed to update property.')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!property) return <div>Property not found.</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Property</h1>
      <PropertyForm property={property} onSubmit={handleSubmit} />
    </div>
  )
}
