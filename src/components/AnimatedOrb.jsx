import { useEffect, useRef, useState } from 'react';
import { Sparkles, Mic } from 'lucide-react';

// Radial gradients + glow per state. Indigo/violet base; amber for thinking.
const GRADIENTS = {
  idle: 'radial-gradient(circle at 35% 30%, #818cf8, #6366f1 45%, #4f46e5 100%)',
  listening: 'radial-gradient(circle at 35% 30%, #93c5fd, #6366f1 50%, #4f46e5 100%)',
  thinking: 'radial-gradient(circle at 35% 30%, #fcd34d, #f59e0b 50%, #d97706 100%)',
  speaking: 'radial-gradient(circle at 35% 30%, #a5b4fc, #6366f1 45%, #4338ca 100%)',
};

const STATIC_GLOW = {
  idle: '0 0 42px 2px rgba(99,102,241,0.35)',
  listening: '0 0 56px 8px rgba(59,130,246,0.5)',
  thinking: '0 0 52px 6px rgba(245,158,11,0.5)',
  speaking: '0 0 42px 2px rgba(99,102,241,0.45)',
};

const RIPPLE_COLOR = {
  listening: 'rgba(59,130,246,0.55)',
  speaking: 'rgba(99,102,241,0.55)',
};

// status: 'idle' | 'listening' | 'thinking' | 'speaking'
// getLevel: () => number (0..1) — real-time TTS amplitude, read while speaking.
export default function AnimatedOrb({ status = 'idle', getLevel }) {
  const [level, setLevel] = useState(0);
  const rafRef = useRef(null);

  // While speaking, poll amplitude on our own rAF so only the orb re-renders.
  useEffect(() => {
    if (status !== 'speaking' || !getLevel) {
      setLevel(0);
      return undefined;
    }
    const loop = () => {
      setLevel(getLevel() || 0);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [status, getLevel]);

  const speaking = status === 'speaking';
  const scale = speaking ? 1 + Math.min(level, 1) * 0.3 : 1; // 1.0 → 1.3
  const glow = speaking
    ? `0 0 ${44 + level * 90}px ${4 + level * 18}px rgba(99,102,241,${0.4 + level * 0.5})`
    : STATIC_GLOW[status];

  const orbAnim =
    status === 'idle'
      ? 'animate-orb-idle'
      : status === 'listening'
        ? 'animate-orb-listen'
        : '';

  const showRipples = status === 'listening' || speaking;
  const rippleColor = RIPPLE_COLOR[status] || 'rgba(99,102,241,0.5)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Ripple rings emanating outward */}
      {showRipples &&
        [0, 0.6, 1.2].map((delay) => (
          <span
            key={delay}
            className="absolute rounded-full border-2 animate-orb-ripple"
            style={{
              width: 184,
              height: 184,
              borderColor: rippleColor,
              animationDelay: `${delay}s`,
            }}
          />
        ))}

      {/* Rotating gradient sweep for the thinking state */}
      {status === 'thinking' && (
        <span
          className="absolute rounded-full animate-orb-spin"
          style={{
            width: 196,
            height: 196,
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(245,158,11,0.65) 90deg, transparent 200deg)',
          }}
        />
      )}

      {/* Core orb */}
      <div
        className={`relative rounded-full ${orbAnim}`}
        style={{
          width: 176,
          height: 176,
          background: GRADIENTS[status],
          boxShadow: glow,
          transform: speaking ? `scale(${scale})` : undefined,
          transition: speaking
            ? 'transform 70ms linear, box-shadow 70ms linear'
            : 'box-shadow 300ms ease, background 300ms ease',
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), transparent 46%)',
          }}
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center text-white/90">
          {status === 'listening' ? <Mic size={36} /> : <Sparkles size={36} />}
        </div>
      </div>
    </div>
  );
}
