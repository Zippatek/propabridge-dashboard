// app/dashboard/listings/create/page.tsx
"use client";

import { useState } from 'react';
import PropertyTextParser from '@/components/property/PropertyTextParser';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Mock of what the AI would return
interface ParsedPropertyData {
  title?: string;
  price?: number;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: string;
  amenities?: string[];
}

export default function CreateListingPage() {
  const [formData, setFormData] = useState<ParsedPropertyData>({});

  const handleParsedData = (data: ParsedPropertyData) => {
    setFormData(data);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>
      <div className="space-y-8">
        <PropertyTextParser onParse={handleParsedData} />
        
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

        <div>
          <label className="text-sm font-medium text-navy-deep">Amenities</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.amenities?.map((amenity, index) => (
              <span key={index} className="bg-beige-light border border-gray-300 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {amenity}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button >Create Listing</Button>
        </div>
      </div>
    </div>
  );
}
