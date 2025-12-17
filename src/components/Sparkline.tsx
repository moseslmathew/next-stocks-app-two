import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export default function Sparkline({ 
  data, 
  width = 100, 
  height = 40, 
  color,
  className = ''
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  // Determine color based on trend if not provided
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = color || (isUp ? '#16a34a' : '#dc2626'); // green-600 : red-600

  // Create points for SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    // Invert Y axis because SVG coordinates start from top-left
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        className={className}
        preserveAspectRatio="none"
    >
      <path
        d={`M ${points}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
