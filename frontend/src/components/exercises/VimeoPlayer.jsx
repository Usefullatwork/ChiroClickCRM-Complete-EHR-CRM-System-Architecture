/**
 * Vimeo Player Component
 * Displays Vimeo videos in an embedded player
 */

import { X, ExternalLink } from 'lucide-react';

const VimeoPlayer = ({ videoUrl, title, onClose, autoplay = true }) => {
  // Extract Vimeo ID from URL
  const getVimeoId = (url) => {
    if (!url) {
      return null;
    }

    // Handle various Vimeo URL formats
    // https://vimeo.com/817620934
    // https://player.vimeo.com/video/817620934
    // https://vimeo.com/817620934?share=copy
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  };

  const vimeoId = getVimeoId(videoUrl);

  if (!vimeoId) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <p className="text-gray-600">Video URL er ugyldig</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Lukk
          </button>
        </div>
      </div>
    );
  }

  // Build embed URL with parameters
  const embedUrl = `https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&title=0&byline=0&portrait=0&dnt=1`;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-black rounded-xl overflow-hidden max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <h3 className="text-white font-medium truncate pr-4">{title || 'Øvelse video'}</h3>
          <div className="flex items-center gap-2">
            <a
              href={`https://vimeo.com/${vimeoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-white/80 hover:text-white transition-colors"
              title="Åpne i Vimeo"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative pt-[56.25%]">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={title || 'Exercise video'}
          />
        </div>
      </div>
    </div>
  );
};

export default VimeoPlayer;
