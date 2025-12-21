import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(to top right, #7c3aed, #4f46e5)', // violet-600 to indigo-600
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px', // Slightly rounded for the icon
        }}
      >
        {/* Simplified ScatterChart-like SVG logic manually drawn or using standard SVG paths if needed. 
            Since we can't easily import lucide-react here without potential issues in edge runtime sometimes, 
            it's safer to use raw SVG path.
            
            ScatterChart lucide path:
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
            <circle cx="18.5" cy="5.5" r=".5" fill="currentColor"/>
            <circle cx="11.5" cy="11.5" r=".5" fill="currentColor"/>
            <circle cx="7.5" cy="16.5" r=".5" fill="currentColor"/>
            <circle cx="17.5" cy="14.5" r=".5" fill="currentColor"/>
            <path d="M3 3v18h18"/>
        */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="18.5" cy="5.5" r=".5" fill="currentColor" />
          <circle cx="11.5" cy="11.5" r=".5" fill="currentColor" />
          <circle cx="7.5" cy="16.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="14.5" r=".5" fill="currentColor" />
          <path d="M3 3v18h18" />
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
