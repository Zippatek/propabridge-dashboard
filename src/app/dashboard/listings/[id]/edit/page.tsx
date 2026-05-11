// app/dashboard/listings/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPropertyById, updateProperty, mockProperties, Property } from '@/lib/mock-data';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [formData, setFormData] = useState<Partial<Property> | null>(null);

  useEffect(() => {
    const property = getPropertyById(id);
    if (property) {
      setFormData(property);
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => (prev ? { ...prev, [name]: value } : null));
  }

  const handleSaveChanges = () => {
    if (formData) {
      updateProperty(id, formData);
      router.push(`/dashboard/property/${id}`);
    }
  };

  if (!formData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          name="title" 
          label="Property Title" 
          placeholder="e.g., 4-Bedroom Detached Duplex"
          value={formData.title || ''}
          onChange={handleInputChange}
        />
        <Input 
          name="price" 
          label="Price" 
          placeholder="e.g., 95000000" 
          type="number"
          value={formData.price || ''}
          onChange={handleInputChange}
         />
        <Input 
          name="location" 
          label="Location" 
          placeholder="e.g., Lokogoma, Abuja" 
          value={formData.location || ''}
          onChange={handleInputChange}
        />
        <Input 
          name="bedrooms" 
          label="Bedrooms" 
          placeholder="e.g., 4" 
          type="number"
          value={formData.bedrooms || ''}
          onChange={handleInputChange}
        />
        <Input 
          name="bathrooms" 
          label="Bathrooms" 
          placeholder="e.g., 4" 
          type="number" 
          value={formData.bathrooms || ''}
          onChange={handleInputChange}
        />
        <Input 
          name="size" 
          label="Size" 
          placeholder="e.g., 400 SQM" 
          value={formData.size || ''}
          onChange={handleInputChange}
        />
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
}
