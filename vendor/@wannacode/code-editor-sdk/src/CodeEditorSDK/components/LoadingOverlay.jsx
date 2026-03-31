import { Loader2 } from 'lucide-react';

/**
 * Компонент оверлея загрузки
 */
export default function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="absolute inset-0 bg-[#0d1117]/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 size={48} className="text-[#58a6ff] animate-spin" />
          <div className="absolute inset-0 animate-ping">
            <Loader2 size={48} className="text-[#58a6ff] opacity-20" />
          </div>
        </div>
        <p className="text-[#e6edf3] text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}


