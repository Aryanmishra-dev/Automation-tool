import StatsCards from '../components/dashboard/StatsCards';
import RecentPosts from '../components/dashboard/RecentPosts';
import UpcomingQueue from '../components/dashboard/UpcomingQueue';
import TrendingTopics from '../components/dashboard/TrendingTopics';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      <StatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentPosts />
        <UpcomingQueue />
      </div>
      <TrendingTopics />
    </div>
  );
}
