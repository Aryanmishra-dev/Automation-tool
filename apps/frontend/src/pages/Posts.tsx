import { useState } from 'react';
import { usePosts, useDeletePost, usePublishPost } from '../hooks/usePosts';
import { formatRelativeTime, getPlatformColor, getStatusColor } from '../lib/utils';
import { Loader2, Plus, Trash2, Send, Edit2, ExternalLink, Filter } from 'lucide-react';
import type { Platform, PostStatus } from '../types';

export default function Posts() {
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>('');
  const [platformFilter, setPlatformFilter] = useState<Platform | ''>('');

  const { data: posts, isLoading, error } = usePosts({
    status: statusFilter || undefined,
    platform: platformFilter || undefined,
  });

  const deletePost = useDeletePost();
  const publishPost = usePublishPost();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(id);
    }
  };

  const handlePublish = async (id: string) => {
    if (window.confirm('Publish this post now?')) {
      publishPost.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Posts</h2>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Create Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PostStatus | '')}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="FAILED">Failed</option>
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as Platform | '')}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Platforms</option>
            <option value="TWITTER">Twitter</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="INSTAGRAM">Instagram</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Error loading posts</p>
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts found</p>
            <p className="text-sm text-gray-400 mt-2">Create your first post to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 mb-2 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPlatformColor(post.platform)}`}>
                        {post.platform}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(post.createdAt)}
                      </span>
                      {post.scheduledFor && post.status === 'SCHEDULED' && (
                        <span className="text-xs text-orange-600">
                          Scheduled: {new Date(post.scheduledFor).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {post.hashtags.slice(0, 5).map((tag, i) => (
                          <span key={i} className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                        {post.hashtags.length > 5 && (
                          <span className="text-xs text-gray-400">+{post.hashtags.length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {post.sourceUrl && (
                      <a
                        href={post.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        title="View source"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {post.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(post.id)}
                        disabled={publishPost.isPending}
                        className="p-2 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50"
                        title="Publish now"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deletePost.isPending}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
