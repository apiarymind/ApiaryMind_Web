'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';
import { revalidatePath } from 'next/cache';
import { getGlobalSettings, updateGlobalSetting } from './admin/get-global-settings';

export interface Video {
  id: string;
  title: string;
  youtube_url: string;
  order: number;
  is_published: boolean;
}

const VIDEOS_SETTING_KEY = 'cms_videos';

// Helper to extract YouTube ID from URL
function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  
  // If it's already just an ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }
  
  // Try to extract from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

export async function getVideos(includeUnpublished = false): Promise<Video[]> {
  // For public access, we don't need auth
  const supabase = createClient();
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', VIDEOS_SETTING_KEY)
    .single();

  if (!data || !data.value) {
    return [];
  }

  try {
    const videos: Video[] = JSON.parse(data.value);
    if (includeUnpublished) {
      return videos;
    }
    return videos.filter(v => v.is_published);
  } catch (error) {
    console.error('Error parsing videos:', error);
    return [];
  }
}

export async function saveVideos(videos: Video[]): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { success: false, error: 'Forbidden' };
  }

  // Sort by order
  const sortedVideos = [...videos].sort((a, b) => a.order - b.order);

  const supabase = createClient();
  
  // Check if setting exists
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', VIDEOS_SETTING_KEY)
    .single();

  const videoJson = JSON.stringify(sortedVideos);

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('app_settings')
      .update({ value: videoJson })
      .eq('key', VIDEOS_SETTING_KEY);

    if (error) {
      console.error('Error updating videos:', error);
      return { success: false, error: error.message };
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('app_settings')
      .insert({
        key: VIDEOS_SETTING_KEY,
        value: videoJson,
        description: 'CMS Videos - Lista wideo z YouTube',
        type: 'string'
      });

    if (error) {
      console.error('Error creating videos setting:', error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath('/dashboard/admin/cms-editor');
  revalidatePath('/');
  
  return { success: true };
}

export async function createVideo(videoData: {
  title: string;
  youtube_url: string;
  order?: number;
  is_published?: boolean;
}): Promise<{ success: boolean; error?: string; video?: Video }> {
  const videos = await getVideos(true); // Get all including unpublished

  // Validate YouTube URL
  const youtubeId = extractYouTubeId(videoData.youtube_url);
  if (!youtubeId) {
    return { success: false, error: 'Nieprawidłowy link YouTube' };
  }

  // Get max order
  const maxOrder = videos.length > 0 ? Math.max(...videos.map(v => v.order)) : 0;
  const order = videoData.order !== undefined ? videoData.order : maxOrder + 1;

  const newVideo: Video = {
    id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: videoData.title,
    youtube_url: `https://www.youtube.com/watch?v=${youtubeId}`, // Store full URL
    order: order,
    is_published: videoData.is_published !== undefined ? videoData.is_published : true,
  };

  const updatedVideos = [...videos, newVideo];
  const result = await saveVideos(updatedVideos);

  if (result.success) {
    return { success: true, video: newVideo };
  }

  return result;
}

export async function updateVideo(videoId: string, videoData: {
  title?: string;
  youtube_url?: string;
  order?: number;
  is_published?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const videos = await getVideos(true);

  const index = videos.findIndex(v => v.id === videoId);
  if (index === -1) {
    return { success: false, error: 'Wideo nie znalezione' };
  }

  const updatedVideo = { ...videos[index] };

  if (videoData.title !== undefined) {
    updatedVideo.title = videoData.title;
  }

  if (videoData.youtube_url !== undefined) {
    const youtubeId = extractYouTubeId(videoData.youtube_url);
    if (!youtubeId) {
      return { success: false, error: 'Nieprawidłowy link YouTube' };
    }
    updatedVideo.youtube_url = `https://www.youtube.com/watch?v=${youtubeId}`;
  }

  if (videoData.order !== undefined) {
    updatedVideo.order = videoData.order;
  }

  if (videoData.is_published !== undefined) {
    updatedVideo.is_published = videoData.is_published;
  }

  videos[index] = updatedVideo;
  return await saveVideos(videos);
}

export async function deleteVideo(videoId: string): Promise<{ success: boolean; error?: string }> {
  const videos = await getVideos(true);
  const filteredVideos = videos.filter(v => v.id !== videoId);
  
  if (filteredVideos.length === videos.length) {
    return { success: false, error: 'Wideo nie znalezione' };
  }

  return await saveVideos(filteredVideos);
}
