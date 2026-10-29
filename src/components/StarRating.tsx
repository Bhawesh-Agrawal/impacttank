'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (val: number) => void;
  size?: number;
  disabled?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = 22,
  disabled = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="stars-container" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            className={`star-btn ${isFilled ? 'active' : ''}`}
            disabled={disabled}
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => !disabled && setHoverValue(null)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              fill={isFilled ? '#F59E0B' : 'none'}
              stroke={isFilled ? '#F59E0B' : 'currentColor'}
              strokeWidth={1.8}
            />
          </button>
        );
      })}
    </div>
  );
}
