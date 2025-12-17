import React from 'react';

interface SparklineBarProps {
  data: number[];
  priceData?: number[]; // For color coding
  width?: number;
  height?: number;
  color?: string; // Default color
  className?: string;
}

export function SparklineBar({ 
  data, 
  priceData,
  width = 100, 
  height = 30, 
  color = '#60a5fa', // blue-400
  className = '' 
}: SparklineBarProps) {
  if (!data || data.length === 0) {
    return <div style={{ width, height }} className={`bg-gray-100 dark:bg-gray-800 rounded ${className}`} />;
  }

  // Normalize data to fit height
  const validData = data.filter(d => typeof d === 'number' && !isNaN(d));
  if (validData.length === 0) return <div style={{ width, height }} className={`bg-gray-100 dark:bg-gray-800 rounded ${className}`} />;

  const max = Math.max(...validData);
  const min = 0; // Volume starts at 0
  const range = max - min || 1;

  // We want to draw bars.
  // SVG viewBox 0 0 width height
  // Each bar width = width / length - gap
  const barWidth = width / validData.length;
  // Gap of 10%? or 1px
  const gap = Math.max(0.5, barWidth * 0.1);
  const effectiveBarWidth = Math.max(0.5, barWidth - gap);

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      className={className}
      preserveAspectRatio="none"
    >
      {validData.map((d, i) => {
        const barHeight = ((d - min) / range) * height; // Full height relative to max
        // y position is height - barHeight (starts from bottom)
        const y = height - barHeight;
        const x = i * barWidth;

        // Determine color
        let barColor = color;
        if (priceData && priceData.length === validData.length && i > 0) {
            const currentPrice = priceData[i];
            const prevPrice = priceData[i - 1];
            if (currentPrice > prevPrice) barColor = '#22c55e'; // green-500
            else if (currentPrice < prevPrice) barColor = '#ef4444'; // red-500
        }

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={effectiveBarWidth}
            height={Math.max(1, barHeight)} // Ensure at least 1px visible
            fill={barColor}
            opacity={0.8}
            className="hover:opacity-100 transition-opacity"
          />
        );
      })}
    </svg>
  );
}
