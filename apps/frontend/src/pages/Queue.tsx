import { usePosts, usePublishPost, useDeletePost } from '../hooks/usePosts';
import { formatDateTime, getPlatformColor } from '../lib/utils';
import { Loader2, Clock, Send, Trash2, Calendar, AlertCircle } from 'lucide-react';

export default function Queue() {
  const { data: scheduledPosts, isLoading, error } = usePosts({ status: 'SCHEDULED' });
  const publishPost = usePublishPost();
  const deletePost = useDeletePost();

  const handlePublishNow = (id: string) => {
    if (window.confirm('Publish this post now?')) {
      publishPost.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this post from the queue?')) {
      deletePost.mutate(id);
    }
  };

  // Sort by scheduled time
  const sortedPosts = scheduledPosts?.sort((a, b) => {
    if (!a.scheduledFor || !b.scheduledFor) return 0;
    return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-orange-500" />
        <h2 className="text-3xl font-bold text-gray-900">Post Queue</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-500 text-center">Error loading queue</p>
        </div>
      ) : !sortedPosts || sortedPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Queue is empty</h3>
          <p className="text-gray-500">No posts are currently scheduled</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {sortedPosts.length} Scheduled Post{sortedPosts.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {sortedPosts.map((post) => {
              const scheduledDate = post.scheduledFor ? new Date(post.scheduledFor) : null;
              const isOverdue = scheduledDate && scheduledDate < new Date();

              return (
                <div key={post.id} className={`p-6 hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {isOverdue && (
                        <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
                          <AlertCircle className="w-4 h-4" />
                          Overdue - should have been published
                        </div>
                      )}
                      <p className="text-gray-900 mb-3 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPlatformColor(post.platform)}`}>
                          {post.platform}
                        </span>
                        {scheduledDate && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {formatDateTime(scheduledDate)}
                          </div>
                        )}
                      </div>
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {post.hashtags.slice(0, 5).map((tag, i) => (
                            <span key={i} className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handlePublishNow(post.id)}
                        disabled={publishPost.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                        title="Publish now"
                      >
                        <Send className="w-4 h-4" />
                        Publish Now
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletePost.isPending}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
