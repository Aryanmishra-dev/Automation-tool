import { useTrends } from '../../hooks/useTrends';
import { Loader2, TrendingUp, Hash } from 'lucide-react';

export default function TrendingTopics() {
  const { data: trends, isLoading, error } = useTrends();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Trending Topics</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Trending Topics</h3>
        <p className="text-red-500 text-center py-8">Error loading trends</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Trending Topics</h3>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      {!trends || trends.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No trending topics yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {trends.slice(0, 12).map((trend, index) => (
            <div
              key={trend.id || index}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-full hover:shadow-sm transition-shadow cursor-pointer"
            >
              <Hash className="w-3 h-3 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">{trend.keyword}</span>
              <span className="text-xs text-gray-400 ml-1">({trend.score?.toFixed(0) || 0})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
