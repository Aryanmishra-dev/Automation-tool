import { useAnalyticsOverview, useAnalyticsHistory } from '../hooks/useAnalytics';
import { usePosts } from '../hooks/usePosts';
import { formatNumber } from '../lib/utils';
import { Loader2, TrendingUp, Heart, Share2, MessageCircle, Eye, BarChart3 } from 'lucide-react';

export default function Analytics() {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useAnalyticsOverview();
  const { data: posts } = usePosts({ status: 'PUBLISHED' });

  const isLoading = analyticsLoading;
  const error = analyticsError;

  const stats = [
    {
      label: 'Total Likes',
      value: analytics?.totalLikes || 0,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Total Shares',
      value: analytics?.totalShares || 0,
      icon: Share2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Comments',
      value: analytics?.totalComments || 0,
      icon: MessageCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Engagement Rate',
      value: `${(analytics?.engagementRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-blue-500" />
        <h2 className="text-3xl font-bold text-gray-900">Analytics</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-500 text-center">Error loading analytics</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Platform Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Platform Performance</h3>
              </div>
              <div className="p-6">
                {analytics?.platformStats && analytics.platformStats.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.platformStats.map((platform) => (
                      <div key={platform.platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            platform.platform === 'TWITTER' ? 'bg-sky-500' :
                            platform.platform === 'LINKEDIN' ? 'bg-blue-600' :
                            'bg-pink-500'
                          }`} />
                          <span className="font-medium text-gray-900">{platform.platform}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{platform.posts} posts</div>
                          <div className="text-sm text-gray-500">{platform.engagement.toFixed(1)}% engagement</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No platform data yet</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Publishing Summary</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-gray-900">{analytics?.totalPosts || 0}</p>
                    <p className="text-sm text-gray-500">Total Posts</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-gray-900">{posts?.length || 0}</p>
                    <p className="text-sm text-gray-500">Published</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Chart Placeholder */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Engagement Over Time</h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Chart visualization coming soon</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
