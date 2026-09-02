'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Eye, ShieldAlert, XCircle } from 'lucide-react';
import { FraudFlag } from '@/lib/types';

interface ProctoringMonitorProps {
  mediaStream: MediaStream | null;
  onDisqualify: (reason: string, flags: FraudFlag[]) => void;
  onFraudWarning: (flag: FraudFlag) => void;
}

export function ProctoringMonitor({
  mediaStream,
  onDisqualify,
  onFraudWarning
}: ProctoringMonitorProps) {
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const missingFaceCounterRef = useRef<number>(0);

  const addFraudFlag = (type: FraudFlag['type'], message: string) => {
    const flag: FraudFlag = {
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };

    setFraudFlags((prev) => {
      const updated = [...prev, flag];
      if (updated.length >= 2) {
        onDisqualify('Integrity Violation: Multiple proctoring flags triggered', updated);
      }
      return updated;
    });

    setActiveWarning(message);
    onFraudWarning(flag);

    setTimeout(() => {
      setActiveWarning(null);
    }, 5000);
  };

  // 1. Tab Focus & Window Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addFraudFlag(
          'tab_switch',
          'Tab switch detected! Leaving the interview window violates integrity guidelines.'
        );
      }
    };

    const handleWindowBlur = () => {
      addFraudFlag(
        'tab_switch',
        'Window focus lost! Please remain on the interview screen.'
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // 2. Client-side Lightweight Canvas Face Analysis
  useEffect(() => {
    if (!mediaStream) return;

    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.play();
    videoRef.current = video;

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    canvasRef.current = canvas;

    let intervalId: NodeJS.Timeout;

    const analyzeWebcamFrame = () => {
      if (!ctx || video.readyState !== 4) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;

      // Simple pixel luminosity & skin tone heuristic check for continuous video presence
      let skinPixels = 0;
      let totalLuminance = 0;

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        totalLuminance += (r + g + b) / 3;

        // General skin tone color range check
        if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
          skinPixels++;
        }
      }

      const totalSampled = data.length / 16;
      const skinRatio = skinPixels / totalSampled;
      const avgLuminance = totalLuminance / totalSampled;

      // Dark room or covered camera check
      if (avgLuminance < 15 || skinRatio < 0.05) {
        missingFaceCounterRef.current += 1;
        if (missingFaceCounterRef.current === 3) {
          addFraudFlag(
            'no_face',
            'No candidate face detected on camera feed! Please ensure your face is fully visible.'
          );
        }
      } else {
        missingFaceCounterRef.current = 0;
      }
    };

    intervalId = setInterval(analyzeWebcamFrame, 2500);

    return () => {
      clearInterval(intervalId);
      video.pause();
    };
  }, [mediaStream]);

  return (
    <div>
      {/* Active Warning Banner */}
      {activeWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 rounded-xl border border-rose-500 bg-rose-950/90 p-4 text-xs text-white shadow-2xl backdrop-blur-xl">
            <AlertTriangle className="h-6 w-6 shrink-0 text-rose-400 animate-pulse" />
            <div className="flex-1">
              <strong className="font-bold text-rose-200 block text-sm">PROCTORING INTEGRITY WARNING</strong>
              <p className="mt-0.5 text-rose-100">{activeWarning}</p>
            </div>
            <button
              onClick={() => setActiveWarning(null)}
              className="rounded-lg p-1 hover:bg-rose-900/50 text-rose-300"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
