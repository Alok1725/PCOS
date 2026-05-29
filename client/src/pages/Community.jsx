import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Heart, Send, MessageSquare, Tag, User, Trash2, Share2, Check } from 'lucide-react';

const TAGS = ['all', 'diet', 'exercise', 'mental_health', 'success_story', 'tips', 'question'];
const TAG_COLORS = {
  diet: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  exercise: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  mental_health: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-300',
  success_story: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300',
  tips: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
  question: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
};

import { api } from '../lib/api';

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('all');
  const [newPost, setNewPost] = useState('');
  const [newTags, setNewTags] = useState([]);
  const [posting, setPosting] = useState(false);
  const [displayName, setDisplayName] = useState('Anonymous Warrior');
  const [showCompose, setShowCompose] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = async (postId) => {
    const url = `${window.location.origin}/community?post=${postId}`;
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for HTTP (non-secure context)
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const fetchPosts = (tag) => {
    setLoading(true);
    const path = tag && tag !== 'all' ? `/api/community?tag=${tag}` : `/api/community`;
    api.get(path)
      .then(d => { setPosts(d.posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(activeTag); }, [activeTag]);

  useEffect(() => {
    if (!user) return;
    api.get(`/api/profile/${user.id}`)
      .then(d => { if (d?.full_name) setDisplayName(d.full_name.split(' ')[0]); })
      .catch(() => {});
  }, [user]);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const data = await api.post('/api/community', { displayName, content: newPost.trim(), tags: newTags });
      setPosts(prev => [data, ...prev]);
      setNewPost('');
      setNewTags([]);
      setShowCompose(false);
    } catch (e) { console.error(e); }
    finally { setPosting(false); }
  };

  const handleLike = async (postId) => {
    const updated = await api.patch(`/api/community/${postId}/like`, {});
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: updated.likes, liked_by: updated.liked_by } : p));
  };

  const handleDelete = async (postId) => {
    await api.delete(`/api/community/${postId}`);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background gradient-mesh-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full pb-24 md:pb-0">
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Community 💗</h1>
              <p className="text-sm text-muted-foreground">Connect with other warriors. Share, support, inspire.</p>
            </div>
            <Button
              onClick={() => setShowCompose(!showCompose)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600"
              size="sm"
            >
              <Send className="h-4 w-4 mr-1.5" /> Share
            </Button>
          </div>

          {/* Compose */}
          {showCompose && (
            <Card className="glass-card fade-in-up">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                    {displayName[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{displayName}</p>
                    <p className="text-[9px] text-muted-foreground">Posting as</p>
                  </div>
                </div>
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Share your experience, tip, or question..."
                  className="w-full p-3 rounded-xl border bg-transparent text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                />
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.filter(t => t !== 'all').map(tag => (
                    <button
                      key={tag}
                      onClick={() => setNewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-all
                        ${newTags.includes(tag) ? TAG_COLORS[tag] + ' border-current font-semibold' : 'text-muted-foreground hover:bg-muted'}
                      `}
                    >
                      #{tag.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={handlePost} disabled={posting || !newPost.trim()}>
                    {posting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tag Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all
                  ${activeTag === tag
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }
                `}
              >
                {tag === 'all' ? '🌐 All' : `#${tag.replace('_', ' ')}`}
              </button>
            ))}
          </div>

          {/* Posts */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 skeleton-shimmer rounded-xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No posts yet. Be the first to share!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 stagger-in">
              {posts.map(post => (
                <Card key={post.id} className="glass-card-hover">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(post.display_name || 'A')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{post.display_name || 'Anonymous'}</span>
                          <span className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</span>
                        </div>
                        <p className="text-sm leading-relaxed mb-2">{post.content}</p>
                        {post.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.tags.map(tag => (
                              <span key={tag} className={`text-[9px] px-2 py-0.5 rounded-full ${TAG_COLORS[tag] || 'bg-muted text-muted-foreground'}`}>
                                #{tag.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 text-xs transition-colors group ${(post.liked_by || []).includes(user?.id) ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'}`}>
                            <Heart className={`h-3.5 w-3.5 transition-all ${(post.liked_by || []).includes(user?.id) ? 'fill-pink-500 text-pink-500' : 'group-hover:fill-pink-500'}`} />
                            {post.likes || 0}
                          </button>
                          <button onClick={() => copyToClipboard(post.id)} className={`flex items-center gap-1 text-xs transition-colors ${copiedId === post.id ? 'text-emerald-500' : 'text-muted-foreground hover:text-pink-500'}`}>
                            {copiedId === post.id ? <><Check className="h-3 w-3" /> Copied!</> : <><Share2 className="h-3 w-3" /> Share</>}
                          </button>
                          {post.user_id === user?.id && (
                            <button onClick={() => handleDelete(post.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
