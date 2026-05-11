'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Property } from '@/lib/mock-data'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { amenities } from '@/lib/amenities'

const propertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  price: z.number().positive('Price must be a positive number'),
  priceType: z.enum(['yearly', 'total']),
  bedrooms: z.number().int().min(0, 'Bedrooms cannot be negative'),
  bathrooms: z.number().int().min(0, 'Bathrooms cannot be negative'),
  size: z.string().min(1, 'Size is required'),
  location: z.string().min(1, 'Location is required'),
  neighborhood: z.string().min(1, 'Neighborhood is required'),
  type: z.enum(['rent', 'sale']),
  amenities: z.array(z.string()).optional(),
  description: z.string().optional(),
})

interface PropertyFormProps {
  property: Property
  onSubmit: (data: Property) => void
}

export function PropertyForm({ property, onSubmit }: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Property>({
    resolver: zodResolver(propertySchema),
    defaultValues: property,
  })

  const handleFormSubmit = (data: Property) => {
    onSubmit({ ...property, ...data })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <Input id="title" {...register('title')} />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
          <Input id="price" type="number" {...register('price', { valueAsNumber: true })} />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label htmlFor="priceType" className="block text-sm font-medium text-gray-700">Price Type</label>
          <select id="priceType" {...register('priceType')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value="yearly">Yearly</option>
            <option value="total">Total</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">Bedrooms</label>
          <Input id="bedrooms" type="number" {...register('bedrooms', { valueAsNumber: true })} />
          {errors.bedrooms && <p className="text-red-500 text-xs mt-1">{errors.bedrooms.message}</p>}
        </div>
        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">Bathrooms</label>
          <Input id="bathrooms" type="number" {...register('bathrooms', { valueAsNumber: true })} />
          {errors.bathrooms && <p className="text-red-500 text-xs mt-1">{errors.bathrooms.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="size" className="block text-sm font-medium text-gray-700">Size (e.g., 400 SQM)</label>
        <Input id="size" {...register('size')} />
        {errors.size && <p className="text-red-500 text-xs mt-1">{errors.size.message}</p>}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
        <Input id="location" {...register('location')} />
        {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
      </div>

      <div>
        <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">Neighborhood</label>
        <Input id="neighborhood" {...register('neighborhood')} />
        {errors.neighborhood && <p className="text-red-500 text-xs mt-1">{errors.neighborhood.message}</p>}
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Listing Type</label>
        <select id="type" {...register('type')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
          <option value="rent">For Rent</option>
          <option value="sale">For Sale</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="description" {...register('description')} rows={4} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Amenities</label>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {amenities.map((amenity) => (
            <div key={amenity} className="flex items-center">
              <input
                id={amenity}
                type="checkbox"
                value={amenity}
                {...register('amenities')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={amenity} className="ml-2 block text-sm text-gray-900">
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit">Save Property</Button>
    </form>
  )
}
