import { usePosts } from '../../hooks/usePosts';
import { formatDateTime, getPlatformColor } from '../../lib/utils';
import { Loader2, Clock, Calendar } from 'lucide-react';

export default function UpcomingQueue() {
  const { data: posts, isLoading, error } = usePosts({ status: 'SCHEDULED', limit: 5 });

  // Sort by scheduled time
  const sortedPosts = posts?.sort((a, b) => {
    if (!a.scheduledFor || !b.scheduledFor) return 0;
    return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Queue</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Queue</h3>
        <p className="text-red-500 text-center py-8">Error loading queue</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Upcoming Queue</h3>
        <Calendar className="w-5 h-5 text-orange-500" />
      </div>
      {!sortedPosts || sortedPosts.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No scheduled posts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
            <div key={post.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <p className="text-sm text-gray-900 line-clamp-2 mb-2">{post.content}</p>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getPlatformColor(post.platform)}`}>
                  {post.platform}
                </span>
                {post.scheduledFor && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(post.scheduledFor)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
