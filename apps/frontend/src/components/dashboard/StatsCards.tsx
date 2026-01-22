import { FileText, CheckCircle, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useAnalyticsOverview } from '../../hooks/useAnalytics';
import { usePosts } from '../../hooks/usePosts';

export default function StatsCards() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverview();
  const { data: posts, isLoading: postsLoading } = usePosts({});

  const isLoading = analyticsLoading || postsLoading;

  const publishedCount = posts?.filter((p) => p.status === 'published').length ?? 0;
  const scheduledCount = posts?.filter((p) => p.status === 'scheduled').length ?? 0;
  const engagementRate = analytics?.engagementRate ?? 0;

  const stats = [
    { label: 'Total Posts', value: posts?.length ?? 0, icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { label: 'Published', value: publishedCount, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Scheduled', value: scheduledCount, icon: Clock, color: 'bg-orange-100 text-orange-600' },
    { label: 'Engagement', value: `${engagementRate.toFixed(1)}%`, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
