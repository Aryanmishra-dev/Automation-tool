import { usePosts } from '../../hooks/usePosts';
import { formatRelativeTime, getPlatformColor, getStatusColor } from '../../lib/utils';
import { Loader2, ExternalLink } from 'lucide-react';

export default function RecentPosts() {
  const { data: posts, isLoading, error } = usePosts({ limit: 5 });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Posts</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Posts</h3>
        <p className="text-red-500 text-center py-8">Error loading posts</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Posts</h3>
      {!posts || posts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No recent posts</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPlatformColor(post.platform)}`}>
                      {post.platform}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(post.createdAt)}
                    </span>
                  </div>
                </div>
                {post.sourceUrl && (
                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-500 ml-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
