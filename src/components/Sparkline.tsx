import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  previousClose?: number;
  timestamps?: number[];
  isIndian?: boolean;
  marketState?: string;
}

export default function Sparkline({ 
  data, 
  width = 100, 
  height = 40, 
  color,
  className = '',
  previousClose,
  timestamps,
  isIndian = false,
  marketState
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div className={`flex items-center justify-center text-[9px] text-gray-400 ${className}`} style={{ width, height }}>
        No Data
      </div>
    );
  }

  let min = Math.min(...data);
  let max = Math.max(...data);

  if (previousClose !== undefined) {
    min = Math.min(min, previousClose);
    max = Math.max(max, previousClose);
  }
  const range = max - min || 1; 

  // Determine color
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = color || (isUp ? '#16a34a' : '#dc2626');

  // Chart Logic: 1D Stretch
  // Only apply stretching if we have timestamps, previousClose (implying 1d), and it's 1D data.
  // currently strictly restricting time-scaling to Indian stocks to avoid US timezone/DST issues causing empty charts.
  const is1D = timestamps && timestamps.length > 0 && previousClose !== undefined && isIndian;
  
  let points = '';

  if (is1D && timestamps && isIndian) {
        // Anchor to the true Market Session to allow gaps at start/end
        // Strategy: Use the LAST timestamp (current data) to find the Session Date.
        // Then construct absolute Open/Close UTC timestamps for that date.
        
        const lastTimestamp = timestamps[timestamps.length - 1];
        
        // Create session anchors
        let sessionOpen = 0;
        let sessionClose = 0;
        
        if (isIndian) {
            // India: UTC+5.5. Open 09:15, Close 15:30
            // Open in UTC: 03:45 AM
            // Close in UTC: 10:00 AM
            const d = new Date(lastTimestamp);
            d.setUTCHours(3, 45, 0, 0);
            sessionOpen = d.getTime();
            
            const closeD = new Date(d);
            closeD.setUTCHours(10, 0, 0, 0);
            sessionClose = closeD.getTime();
        } 
        // US Logic removed for safety, falling back to stretch-fit below.

        const totalDuration = sessionClose - sessionOpen;

        points = data.map((value, index) => {
            const time = timestamps[index];
            const timeFromOpen = time - sessionOpen;
            
            // Normalize X to fit full market day (0 to 100%)
            let percentX = timeFromOpen / totalDuration;
            
            // Clamp to avoid drawing outside
            percentX = Math.max(0, Math.min(1, percentX));

            const x = percentX * width;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');
  } else {
        // Standard "Fill Width" for non-1D or US Stocks (Safe fallback)
        points = data.map((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');
  }

  return (
    <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        className={className}
        preserveAspectRatio="none"
    >
      {/* Reference Line (Previous Close) */}
      {previousClose !== undefined && (
        <line
            x1="0"
            y1={height - ((previousClose - min) / range) * height}
            x2={width}
            y2={height - ((previousClose - min) / range) * height}
            stroke="#9ca3af" // gray-400
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
        />
      )}
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
