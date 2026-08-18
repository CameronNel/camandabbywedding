import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX, Sparkles } from 'lucide-react';

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.4);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Soft romantic piano-style synthesizer using Web Audio API
  const playRomanticChordProgression = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (!gainNodeRef.current) {
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
        masterGain.connect(ctx.destination);
        gainNodeRef.current = masterGain;
      }

      // Romantic chord progressions in D major / B minor (F#4, A4, D5, C#5, B4, etc.)
      const chordChords = [
        [293.66, 369.99, 440.00, 587.33], // D maj (D4, F#4, A4, D5)
        [246.94, 293.66, 369.99, 440.00], // B min7 (B3, D4, F#4, A4)
        [220.00, 277.18, 329.63, 440.00], // A maj (A3, C#4, E4, A4)
        [196.00, 246.94, 293.66, 392.00], // G maj (G3, B3, D4, G4)
      ];

      let chordIdx = 0;
      let arpeggioStep = 0;

      const playNote = (freq: number, startTime: number, duration: number) => {
        if (!audioCtxRef.current || !gainNodeRef.current) return;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Soft sine + gentle triangle harmonic
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        // Gentle envelope (soft attack, long release)
        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.linearRampToValueAtTime(0.18, startTime + 0.12);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(noteGain);
        noteGain.connect(gainNodeRef.current);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
      };

      const step = () => {
        const currentChord = chordChords[chordIdx];
        const now = ctx.currentTime;

        // Play arpeggiated note
        const noteFreq = currentChord[arpeggioStep % currentChord.length];
        playNote(noteFreq, now, 2.2);

        // Low bass note on beat 0
        if (arpeggioStep === 0) {
          playNote(currentChord[0] / 2, now, 3.5);
        }

        arpeggioStep = (arpeggioStep + 1) % currentChord.length;
        if (arpeggioStep === 0) {
          chordIdx = (chordIdx + 1) % chordChords.length;
        }
      };

      step();
      // Step every 750ms for gentle romantic tempo
      intervalRef.current = window.setInterval(step, 750);
    } catch (e) {
      console.error('Audio synthesizer error', e);
    }
  };

  const stopMusic = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopMusic();
      setIsPlaying(false);
    } else {
      playRomanticChordProgression();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume * 0.15, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopMusic();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <aside aria-label="Music and ambiance controls" className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-full border border-blush-200 shadow-xl shadow-blush-900/10 hover:shadow-blush-900/20 transition-all">
        <button
          onClick={togglePlay}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs tracking-wider uppercase font-medium transition-all ${
            isPlaying
              ? 'bg-gradient-to-r from-blush-500 to-rose-400 text-white shadow-md shadow-blush-500/25'
              : 'bg-blush-50 text-rosewood hover:bg-blush-100'
          }`}
          title={isPlaying ? 'Pause Background Music' : 'Play Romantic Wedding Ambiance'}
        >
          {isPlaying ? (
            <>
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <span>Music: On</span>
              <span className="flex items-center gap-0.5 ml-1">
                <span className="w-1 h-3 bg-white rounded-full animate-pulse"></span>
                <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-75"></span>
                <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150"></span>
              </span>
            </>
          ) : (
            <>
              <Music className="w-3.5 h-3.5 text-blush-500" />
              <span>Play Music</span>
              <Sparkles className="w-3 h-3 text-gold" />
            </>
          )}
        </button>

        {isPlaying && (
          <button
            onClick={() => setVolume(v => (v === 0 ? 0.4 : 0))}
            className="text-stone-400 hover:text-stone-700 transition p-1"
            title="Mute / Unmute"
          >
            {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </aside>
  );
};
