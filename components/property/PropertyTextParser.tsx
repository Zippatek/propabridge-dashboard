// components/property/PropertyTextParser.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface PropertyTextParserProps {
  onParse: (data: any) => void;
}

export default function PropertyTextParser({ onParse }: PropertyTextParserProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleParse = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/listings/parse-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      onParse(data);
    } catch (error) {
      console.error('Failed to parse property text:', error);
      // Handle error state in UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-grey-divider shadow-sm">
      <h3 className="text-lg font-semibold text-navy-deep mb-2">Parse Property from Text</h3>
      <p className="text-grey-subtle text-sm mb-4">
        Paste the full text description of a property below, and our AI will attempt to automatically fill the form for you.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g., A 4-bedroom duplex in Lokogoma, Abuja for 95 million..."
        className="w-full h-32 p-3 border border-grey-divider rounded-md focus:ring-2 focus:ring-blue-action focus:border-blue-action transition"
      />
      <div className="mt-4 flex justify-end">
        <Button onClick={handleParse} disabled={isLoading}>
          {isLoading ? 'Parsing...' : 'Parse Text & Fill Form'}
        </Button>
      </div>
    </div>
  );
}
