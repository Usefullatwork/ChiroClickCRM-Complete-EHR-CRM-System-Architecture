/**
 * Video Player Component
 * YouTube player wrapper for exercise videos
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';

interface VideoPlayerProps {
  videoUrl?: string;
  videoId?: string;
  title?: string;
  autoPlay?: boolean;
  onReady?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Already just an ID
  if (url.match(/^[a-zA-Z0-9_-]{11}$/)) {
    return url;
  }

  // Various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function VideoPlayer({
  videoUrl,
  videoId,
  title,
  autoPlay = false,
  onReady,
  onEnd,
  onError
}: VideoPlayerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const playerRef = useRef<YoutubeIframeRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playing, setPlaying] = useState(autoPlay);
  const [error, setError] = useState<string | null>(null);

  // Determine video ID
  const actualVideoId = videoId || (videoUrl ? extractYouTubeId(videoUrl) : null);

  const screenWidth = Dimensions.get('window').width;
  const playerHeight = (screenWidth - 32) * (9 / 16); // 16:9 aspect ratio with padding

  const handleReady = useCallback(() => {
    setIsLoading(false);
    onReady?.();
  }, [onReady]);

  const handleStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
      onEnd?.();
    }
  }, [onEnd]);

  const handleError = useCallback((e: string) => {
    setError('Kunne ikke laste video');
    setIsLoading(false);
    onError?.(e);
  }, [onError]);

  const togglePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const styles = createStyles(isDark, playerHeight);

  if (!actualVideoId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>🎬</Text>
        <Text style={styles.errorText}>Ingen video tilgjengelig</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setIsLoading(true);
          }}
        >
          <Text style={styles.retryText}>Prøv igjen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Title */}
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Player Container */}
      <View style={styles.playerContainer}>
        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Laster video...</Text>
          </View>
        )}

        {/* YouTube Player */}
        <YoutubePlayer
          ref={playerRef}
          height={playerHeight}
          width={screenWidth - 32}
          videoId={actualVideoId}
          play={playing}
          onReady={handleReady}
          onChangeState={handleStateChange}
          onError={handleError}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false
          }}
          initialPlayerParams={{
            controls: true,
            modestbranding: true,
            rel: false,
            showClosedCaptions: false
          }}
        />
      </View>

      {/* Custom Controls (optional) */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
          <Text style={styles.playButtonText}>{playing ? '⏸' : '▶️'}</Text>
          <Text style={styles.playButtonLabel}>{playing ? 'Pause' : 'Spill av'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean, playerHeight: number) =>
  StyleSheet.create({
    container: {
      width: '100%'
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 12
    },
    playerContainer: {
      width: '100%',
      height: playerHeight,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
      position: 'relative'
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
      zIndex: 1
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    errorContainer: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    },
    errorIcon: {
      fontSize: 40,
      marginBottom: 12
    },
    errorText: {
      fontSize: 16,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center'
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: '#007AFF',
      borderRadius: 8
    },
    retryText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600'
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12
    },
    playButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: 20
    },
    playButtonText: {
      fontSize: 16,
      marginRight: 6
    },
    playButtonLabel: {
      fontSize: 14,
      color: isDark ? '#FFFFFF' : '#000000',
      fontWeight: '500'
    }
  });

export default VideoPlayer;
