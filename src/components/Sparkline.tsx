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
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; 

  // Determine color
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = color || (isUp ? '#16a34a' : '#dc2626');

  // Chart Logic: 1D Stretch
  // Only apply stretching if we have timestamps, previousClose (implying 1d), and it's 1D data
  const is1D = timestamps && timestamps.length > 0 && previousClose !== undefined;
  
  let points = '';

  if (is1D && timestamps) {
        // Anchor to the true Market Session to allow gaps at start/end
        // Strategy: Use the LAST timestamp (current data) to find the Session Date.
        // Then construct absolute Open/Close UTC timestamps for that date.
        
        const lastTimestamp = timestamps[timestamps.length - 1];
        const lastDate = new Date(lastTimestamp);
        
        // UTC Offsets in Hours
        // India: +5.5 (IST)
        // US: -5 (EST) or -4 (EDT). We infer based on recent data or 'isIndian'.
        // Simple heuristic for US: Open is 9:30 AM. In UTC that is 14:30 (Winter) or 13:30 (Summer).
        
        // Create session anchors
        let sessionOpen = 0;
        let sessionClose = 0;
        
        if (isIndian) {
            // India: UTC+5.5. Open 09:15, Close 15:30
            // Open in UTC: 03:45 AM
            // Close in UTC: 10:00 AM
            const utcDate = new Date(lastTimestamp);
            // Reset to midnight UTC roughly for the day calculation? 
            // Better: Adjust using the known offset to get "Session Day at Midnight Local"
            // Then add hours.
            // Actually, just working in UTC is safer if we know the UTC open/close.
            
            // Construct Open at 03:45 UTC on the same YYYY-MM-DD
            const d = new Date(lastTimestamp);
            // If data is late (e.g. 03:50 UTC), we want 03:45.
            // If we are in +5.5 timezone, 03:45 UTC is 9:15 AM.
            // The safest extraction is string manipulation of the UTC date?
            // "2024-12-24T03:50:00.000Z" -> "2024-12-24T03:45:00.000Z"
            
            // Note: If session crosses UTC midnight (not the case for IN/US), this fails.
            // IN: 03:45 - 10:00. Safe.
            // US: 14:30 - 21:00. Safe.
            
            d.setUTCHours(3, 45, 0, 0);
            sessionOpen = d.getTime();
            
            const closeD = new Date(d);
            closeD.setUTCHours(10, 0, 0, 0);
            sessionClose = closeD.getTime();
            
            // Correction: If last timestamp was BEFORE 03:45 UTC (premarket?) or AFTER 10:00 UTC?
            // Our filter logic ensures we have the right session.
        } else {
             // US: Open 09:30 Local.
             // We need to support both EST 14:30 and EDT 13:30.
             // Heuristic: Check hour of first data point? 
             // If first data point hour (UTC) is 13, it's EDT. If 14, EST. 
             const firstHour = new Date(timestamps[0]).getUTCHours();
             const isSummer = firstHour === 13;
             
             const openUTC = isSummer ? 13 : 14; 
             const closeUTC = openUTC + 6; // 13+6.5 = 19:30 or 14+6.5 = 20:30? No.
             // Market duration 6.5 hours.
             // 13:30 + 6.5 = 20:00. NO, 9:30 to 4:00 is 6.5 hrs.
             // 13:30 to 20:00.
             
             const d = new Date(lastTimestamp);
             d.setUTCHours(openUTC, 30, 0, 0); // 13:30 or 14:30
             sessionOpen = d.getTime();
             
             const closeD = new Date(d);
             // 16:00 Local = 09:30 + 6h 30m
             closeD.setTime(d.getTime() + (6.5 * 60 * 60 * 1000)); 
             sessionClose = closeD.getTime();
         }

        const totalDuration = sessionClose - sessionOpen;

        points = data.map((value, index) => {
            const time = timestamps[index];
            const timeFromOpen = time - sessionOpen;
            
            // Normalize X to fit full market day (0 to 100%)
            // Clamp between 0 and 1 ideally, but sometimes pre-market exists? 
            // Assuming regular market data for now.
            let percentX = timeFromOpen / totalDuration;
            
            // Clamp to avoid drawing outside (e.g. if slightly off)
            percentX = Math.max(0, Math.min(1, percentX));

            const x = percentX * width;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');
  } else {
        // Standard "Fill Width" for non-1D (e.g. 1 Year)
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
      {previousClose !== undefined && previousClose >= min && previousClose <= max && (
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
