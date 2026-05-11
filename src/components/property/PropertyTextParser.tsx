'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface PropertyTextParserProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onParse: (data: any) => void;
}

export default function PropertyTextParser({ onParse }: PropertyTextParserProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/listings/parse-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to parse. Try again.');
        return;
      }
      onParse(data);
      setText('');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-grey-divider shadow-sm">
      <h3 className="text-lg font-semibold text-navy-deep mb-1">Paste &amp; Auto-Fill</h3>
      <p className="text-grey-subtle text-sm mb-4">
        Paste <strong>any format</strong> — spreadsheet row, CSV, WhatsApp message, agent notes,
        plain description, or JSON. AI will extract the property fields and fill the form.
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={
          'Paste anything, e.g.:\n' +
          '• 4bed | Lekki Phase 1 | 120m | serviced | pool\n' +
          '• Title\tBedrooms\tPrice\n  Luxury Duplex\t5\t250000000\n' +
          '• "3 bedroom flat in Wuse 2, N85m, 2 baths, BQ, 24/7 power"'
        }
        rows={5}
        className="w-full p-3 border border-grey-divider rounded-md text-sm focus:ring-2 focus:ring-blue-action focus:border-blue-action transition resize-y"
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      <div className="mt-3 flex justify-end">
        <Button onClick={handleParse} disabled={isLoading || !text.trim()} isLoading={isLoading}>
          {isLoading ? 'Parsing...' : 'Auto-Fill from Paste'}
        </Button>
      </div>
    </div>
  );
}
