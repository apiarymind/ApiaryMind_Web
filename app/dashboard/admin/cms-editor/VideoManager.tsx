'use client'

import { useState, useEffect } from 'react';
import { Video, getVideos, createVideo, updateVideo, deleteVideo } from '@/app/actions/videos';
import { Plus, Edit2, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VideoManager() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    youtube_url: '',
    is_published: true,
    order: 0
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    const data = await getVideos(true); // Include unpublished
    setVideos(data);
    setLoading(false);
  };

  const handleEdit = (video: Video) => {
    setEditingId(video.id);
    setFormData({
      title: video.title,
      youtube_url: video.youtube_url,
      is_published: video.is_published,
      order: video.order
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      title: '',
      youtube_url: '',
      is_published: true,
      order: 0
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let result;
      if (editingId) {
        result = await updateVideo(editingId, formData);
      } else {
        result = await createVideo(formData);
      }

      if (result.success) {
        await loadVideos();
        handleCancel();
      } else {
        alert('Błąd: ' + (result.error || 'Nieznany błąd'));
      }
    } catch (error: any) {
      alert('Błąd: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to wideo?')) return;
    setLoading(true);
    try {
      const result = await deleteVideo(id);
      if (result.success) {
        await loadVideos();
      } else {
        alert('Błąd: ' + (result.error || 'Nieznany błąd'));
      }
    } catch (error: any) {
      alert('Błąd: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const index = videos.findIndex(v => v.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= videos.length) return;

    const current = videos[index];
    const target = videos[newIndex];

    setLoading(true);
    try {
      await Promise.all([
        updateVideo(current.id, { order: target.order }),
        updateVideo(target.id, { order: current.order })
      ]);
      await loadVideos();
    } catch (error: any) {
      alert('Błąd: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && videos.length === 0) {
    return <div className="text-white/60">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Zarządzanie Wideo</h2>
        {!editingId && (
          <button
            onClick={() => setEditingId('new')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj Wideo
          </button>
        )}
      </div>

      {/* Form */}
      {editingId && (
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
          <h3 className="text-lg font-bold mb-4 text-white">
            {editingId === 'new' ? 'Nowe Wideo' : 'Edytuj Wideo'}
          </h3>
          
            <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Tytuł</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Tytuł wideo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Link YouTube</label>
              <input
                type="text"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="https://www.youtube.com/watch?v=... lub https://youtu.be/..."
                required
              />
              <p className="text-xs text-white/50 mt-1">Wklej pełny link do filmu YouTube</p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Opublikowane
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Zapisz
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Videos List */}
      <div className="space-y-2">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10 dark:border-white/5 flex items-start gap-4"
          >
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-black relative">
              {(() => {
                // Extract YouTube ID from URL
                const youtubeIdMatch = video.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                const youtubeId = youtubeIdMatch ? youtubeIdMatch[1] : '';
                return youtubeId ? (
                  <Image
                    src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                    alt={video.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">Brak</div>
                );
              })()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!video.is_published && (
                      <span className="text-xs font-bold bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">
                        <EyeOff className="w-3 h-3 inline mr-1" />
                        Nieopublikowane
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white mb-1">{video.title}</h4>
                  <a 
                    href={video.youtube_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-amber-400 hover:text-amber-300 break-all"
                  >
                    {video.youtube_url}
                  </a>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleMove(video.id, 'up')}
                    disabled={index === 0}
                    className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-30"
                    title="Przenieś w górę"
                  >
                    <ArrowUp className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => handleMove(video.id, 'down')}
                    disabled={index === videos.length - 1}
                    className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-30"
                    title="Przenieś w dół"
                  >
                    <ArrowDown className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => handleEdit(video)}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                    title="Edytuj"
                  >
                    <Edit2 className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-2 hover:bg-red-500/20 rounded transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {videos.length === 0 && !loading && (
          <div className="text-center py-8 text-white/60">
            Brak wideo. Dodaj pierwsze wideo używając przycisku powyżej.
          </div>
        )}
      </div>
    </div>
  );
}

