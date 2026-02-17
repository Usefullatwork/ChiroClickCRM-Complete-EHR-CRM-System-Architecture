/**
 * Video Offline Toggle Component
 *
 * Allows patients to choose whether to cache exercise videos for offline viewing.
 * Features:
 * - Toggle to cache/uncache individual videos
 * - Progress indicator during download
 * - Storage size display
 * - Batch download/remove for all videos
 *
 * Bilingual: English/Norwegian
 */

import _React, { useState, useEffect } from 'react';
import {
  Download,
  Trash2,
  Check,
  Loader2,
  HardDrive,
  Wifi,
  WifiOff,
  Video,
  AlertCircle,
} from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const TRANSLATIONS = {
  no: {
    saveForOffline: 'Lagre for frakoblet bruk',
    removeOffline: 'Fjern fra frakoblet',
    downloading: 'Laster ned...',
    saved: 'Lagret',
    savingVideo: 'Lagrer video for frakoblet bruk',
    removingVideo: 'Fjerner fra frakoblet lagring',
    videoSaved: 'Video lagret for frakoblet bruk',
    videoRemoved: 'Video fjernet fra frakoblet lagring',
    downloadAll: 'Last ned alle videoer',
    removeAll: 'Fjern alle videoer',
    storageUsed: 'brukt',
    offlineAvailable: 'Tilgjengelig frakoblet',
    notAvailableOffline: 'Ikke tilgjengelig frakoblet',
    downloadFailed: 'Kunne ikke laste ned video',
    noVideos: 'Ingen videoer a laste ned',
    videosToDownload: 'videoer kan lastes ned',
    videoCached: 'video lagret',
    videosCached: 'videoer lagret',
  },
  en: {
    saveForOffline: 'Save for offline',
    removeOffline: 'Remove offline',
    downloading: 'Downloading...',
    saved: 'Saved',
    savingVideo: 'Saving video for offline use',
    removingVideo: 'Removing from offline storage',
    videoSaved: 'Video saved for offline use',
    videoRemoved: 'Video removed from offline storage',
    downloadAll: 'Download all videos',
    removeAll: 'Remove all videos',
    storageUsed: 'used',
    offlineAvailable: 'Available offline',
    notAvailableOffline: 'Not available offline',
    downloadFailed: 'Failed to download video',
    noVideos: 'No videos to download',
    videosToDownload: 'videos can be downloaded',
    videoCached: 'video saved',
    videosCached: 'videos saved',
  },
};

// =============================================================================
// SINGLE VIDEO TOGGLE
// =============================================================================

/**
 * VideoOfflineToggle Component
 *
 * @param {object} props
 * @param {string} props.videoUrl - URL of the video
 * @param {string} props.exerciseId - Exercise ID for tracking
 * @param {string} props.exerciseName - Exercise name for display
 * @param {string} props.lang - Language ('no' or 'en')
 * @param {string} props.variant - Display variant ('button', 'toggle', 'icon')
 * @param {function} props.onCached - Callback when video is cached
 * @param {function} props.onRemoved - Callback when video is removed
 */
export function VideoOfflineToggle({
  videoUrl,
  exerciseId,
  _exerciseName,
  lang = 'no',
  variant = 'button',
  onCached,
  onRemoved,
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.no;

  const { cacheVideo, removeCachedVideo, checkVideoCached, isOnline } = useOffline();

  const [isCached, setIsCached] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if video is cached on mount
  useEffect(() => {
    if (videoUrl) {
      checkVideoCached(videoUrl).then(setIsCached);
    }
  }, [videoUrl, checkVideoCached]);

  // Handle toggle
  const handleToggle = async () => {
    if (!videoUrl) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isCached) {
        // Remove from cache
        const success = await removeCachedVideo(videoUrl);
        if (success) {
          setIsCached(false);
          if (onRemoved) {
            onRemoved(videoUrl, exerciseId);
          }
        }
      } else {
        // Add to cache
        if (!isOnline) {
          setError(t.downloadFailed);
          return;
        }

        const success = await cacheVideo(videoUrl, exerciseId);
        if (success) {
          setIsCached(true);
          if (onCached) {
            onCached(videoUrl, exerciseId);
          }
        } else {
          setError(t.downloadFailed);
        }
      }
    } catch (err) {
      console.error('Error toggling video cache:', err);
      setError(t.downloadFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // No video URL
  if (!videoUrl) {
    return null;
  }

  // Render based on variant
  switch (variant) {
    case 'icon':
      return (
        <button
          onClick={handleToggle}
          disabled={isLoading || (!isOnline && !isCached)}
          className={`
            p-2 rounded-lg transition-colors
            ${
              isCached
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
            ${isLoading ? 'opacity-50 cursor-wait' : ''}
            ${!isOnline && !isCached ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={isCached ? t.saved : t.saveForOffline}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isCached ? (
            <Check className="w-5 h-5" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </button>
      );

    case 'toggle':
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="text-sm text-gray-700">
            {isCached ? t.offlineAvailable : t.saveForOffline}
          </span>
          <button
            onClick={handleToggle}
            disabled={isLoading || (!isOnline && !isCached)}
            className={`
              relative w-11 h-6 rounded-full transition-colors
              ${isCached ? 'bg-green-500' : 'bg-gray-300'}
              ${isLoading ? 'opacity-50' : ''}
              ${!isOnline && !isCached ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span
              className={`
                absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                ${isCached ? 'translate-x-5' : 'translate-x-0'}
              `}
            >
              {isLoading && <Loader2 className="w-4 h-4 m-0.5 text-gray-400 animate-spin" />}
            </span>
          </button>
        </label>
      );

    case 'button':
    default:
      return (
        <div className="space-y-1">
          <button
            onClick={handleToggle}
            disabled={isLoading || (!isOnline && !isCached)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                isCached
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
              ${isLoading ? 'opacity-50 cursor-wait' : ''}
              ${!isOnline && !isCached ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.downloading}
              </>
            ) : isCached ? (
              <>
                <Check className="w-4 h-4" />
                {t.saved}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t.saveForOffline}
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>
      );
  }
}

// =============================================================================
// BATCH VIDEO MANAGER
// =============================================================================

/**
 * VideoOfflineManager Component
 * Manages offline caching for multiple videos
 *
 * @param {object} props
 * @param {Array} props.exercises - List of exercises with video URLs
 * @param {string} props.lang - Language
 */
export function VideoOfflineManager({ exercises, lang = 'no' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.no;

  const {
    isOnline,
    _cachedVideoCount,
    cachedVideoSize,
    cacheVideo,
    removeCachedVideo,
    checkVideoCached,
  } = useOffline();

  const [cachedUrls, setCachedUrls] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Get videos with URLs
  const videosWithUrls = exercises?.filter((e) => e.videoUrl) || [];

  // Check which videos are cached on mount
  useEffect(() => {
    const checkCachedVideos = async () => {
      const cached = new Set();
      for (const exercise of videosWithUrls) {
        if (await checkVideoCached(exercise.videoUrl)) {
          cached.add(exercise.videoUrl);
        }
      }
      setCachedUrls(cached);
    };

    checkCachedVideos();
  }, [exercises, checkVideoCached]);

  // Format size
  const formatSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Download all videos
  const handleDownloadAll = async () => {
    if (!isOnline) {
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: videosWithUrls.length });

    for (let i = 0; i < videosWithUrls.length; i++) {
      const exercise = videosWithUrls[i];
      if (!cachedUrls.has(exercise.videoUrl)) {
        await cacheVideo(exercise.videoUrl, exercise.exerciseId || exercise.id);
        setCachedUrls((prev) => new Set([...prev, exercise.videoUrl]));
      }
      setProgress({ current: i + 1, total: videosWithUrls.length });
    }

    setIsProcessing(false);
  };

  // Remove all videos
  const handleRemoveAll = async () => {
    setIsProcessing(true);
    setProgress({ current: 0, total: cachedUrls.size });

    let current = 0;
    for (const url of cachedUrls) {
      await removeCachedVideo(url);
      current++;
      setProgress({ current, total: cachedUrls.size });
    }

    setCachedUrls(new Set());
    setIsProcessing(false);
  };

  if (videosWithUrls.length === 0) {
    return null;
  }

  const uncachedCount = videosWithUrls.length - cachedUrls.size;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Video className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Frakoblet video</h3>
            <p className="text-sm text-gray-500">
              {cachedUrls.size > 0 ? (
                <>
                  {cachedUrls.size} {cachedUrls.size === 1 ? t.videoCached : t.videosCached}
                  {cachedVideoSize > 0 && (
                    <span className="ml-1">
                      ({formatSize(cachedVideoSize)} {t.storageUsed})
                    </span>
                  )}
                </>
              ) : (
                `${videosWithUrls.length} ${t.videosToDownload}`
              )}
            </p>
          </div>
        </div>

        {/* Connection indicator */}
        <div
          className={`flex items-center gap-1 text-xs ${isOnline ? 'text-green-600' : 'text-amber-600'}`}
        >
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        </div>
      </div>

      {/* Progress bar when processing */}
      {isProcessing && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>
              {progress.current} / {progress.total}
            </span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {uncachedCount > 0 && (
          <button
            onClick={handleDownloadAll}
            disabled={isProcessing || !isOnline}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                isOnline
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
              ${isProcessing ? 'opacity-50 cursor-wait' : ''}
            `}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {t.downloadAll} ({uncachedCount})
          </button>
        )}

        {cachedUrls.size > 0 && (
          <button
            onClick={handleRemoveAll}
            disabled={isProcessing}
            className={`
              flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              bg-red-50 text-red-600 hover:bg-red-100 transition-colors
              ${isProcessing ? 'opacity-50 cursor-wait' : ''}
            `}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {t.removeAll}
          </button>
        )}
      </div>

      {/* Storage info */}
      {cachedVideoSize > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <HardDrive className="w-3 h-3" />
          <span>
            {formatSize(cachedVideoSize)} {t.storageUsed}
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default VideoOfflineToggle;
