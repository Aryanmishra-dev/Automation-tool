import { useTrends } from '../hooks/useTrends';
import { formatRelativeTime } from '../lib/utils';
import { Loader2, TrendingUp, Hash, RefreshCw, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { trendKeys } from '../hooks/useTrends';

export default function Trends() {
  const { data: trends, isLoading, error, isFetching } = useTrends();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: trendKeys.top() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-green-500" />
          <h2 className="text-3xl font-bold text-gray-900">Trending Topics</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-500 text-center">Error loading trends</p>
        </div>
      ) : !trends || trends.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trends yet</h3>
          <p className="text-gray-500">Trends will appear once RSS feeds are processed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Trends List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Top Keywords</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {trends.slice(0, 10).map((trend, index) => (
                <div key={trend.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${index < 3 ? 'text-green-500' : 'text-gray-400'}`}>
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{trend.keyword}</p>
                      <p className="text-xs text-gray-500">
                        Last seen: {formatRelativeTime(trend.lastSeen)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {trend.score?.toFixed(0) || 0}
                    </div>
                    <div className="text-xs text-gray-500">score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Cloud */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Keyword Cloud</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {trends.map((trend, index) => {
                  const maxScore = trends[0]?.score || 1;
                  const size = Math.max(0.75, (trend.score || 0) / maxScore);
                  
                  return (
                    <span
                      key={trend.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-full hover:shadow-sm transition-all cursor-pointer hover:scale-105"
                      style={{ fontSize: `${0.75 + size * 0.5}rem` }}
                    >
                      <Hash className="w-3 h-3 text-blue-500" />
                      <span className="font-medium text-gray-700">{trend.keyword}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg shadow overflow-hidden lg:col-span-2">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Trend Categories</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Technology', 'AI/ML', 'Business', 'Science'].map((category) => {
                  const categoryTrends = trends.filter(
                    (t) => t.category?.toLowerCase() === category.toLowerCase()
                  );
                  return (
                    <div key={category} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {categoryTrends.length}
                      </p>
                      <p className="text-xs text-gray-500">trends</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
