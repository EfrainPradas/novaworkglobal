import { PlayCircle } from 'lucide-react'

interface VideoLinkProps {
  videoSrc: string
  title: string
  description: string
  className?: string
}

export default function VideoLink({ videoSrc, title, description, className = '' }: VideoLinkProps) {
  const handleClick = () => {
    // Open video in new window/tab
    const videoWindow = window.open('', '_blank', 'width=800,height=600')
    if (videoWindow) {
      videoWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              h1 {
                color: white;
                margin-bottom: 20px;
                text-align: center;
              }
              video {
                max-width: 90%;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <video controls autoplay style="max-width: 100%">
              <source src="${window.location.origin}${videoSrc}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </body>
        </html>
      `)
      videoWindow.document.close()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${className}`}
    >
      <PlayCircle className="w-6 h-6 flex-shrink-0" />
      <div className="text-left">
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs opacity-90">{description}</div>
      </div>
    </button>
  )
}
