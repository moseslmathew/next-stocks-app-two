import { getIndiaMarketPrediction, getUSMarketPrediction } from '@/actions/ai';
import SentimentDashboard from '@/components/SentimentDashboard';

export const metadata = {
  title: 'AI Market Sentiment - Tensor Terminal',
  description: 'AI-powered probability analysis for the next trading session.',
};

export default async function AISentimentPage() {
  // Fetch both regions in parallel for optimal performance
  const [indiaData, usData] = await Promise.all([
    getIndiaMarketPrediction(),
    getUSMarketPrediction()
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
         <SentimentDashboard indiaData={indiaData} usData={usData} />
      </div>
    </div>
  );
}
