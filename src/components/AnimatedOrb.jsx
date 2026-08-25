import { useEffect, useRef, useState } from 'react';
import { Sparkles, Mic } from 'lucide-react';

// Radial gradients + glow per state. Indigo/violet base (center → mid → outer →
// edge); amber for connecting/thinking; red for error.
const BASE_GRADIENT =
  'radial-gradient(circle at 35% 30%, #818cf8, #6366f1 35%, #4f46e5 70%, #3730a3 100%)';
const AMBER_GRADIENT = 'radial-gradient(circle at 35% 30%, #fcd34d, #f59e0b 55%, #b45309 100%)';
const ERROR_GRADIENT = 'radial-gradient(circle at 35% 30%, #fca5a5, #ef4444 55%, #991b1b 100%)';
const GRADIENTS = {
  idle: BASE_GRADIENT,
  listening: BASE_GRADIENT,
  speaking: BASE_GRADIENT,
  connecting: AMBER_GRADIENT,
  thinking: AMBER_GRADIENT,
  error: ERROR_GRADIENT,
};

const STATIC_GLOW = {
  idle: '0 0 42px 2px rgba(99,102,241,0.35)',
  listening: '0 0 40px 8px rgba(96,165,250,0.65)',
  connecting: '0 0 52px 6px rgba(245,158,11,0.5)',
  thinking: '0 0 52px 6px rgba(245,158,11,0.5)',
  speaking: '0 0 44px 2px rgba(99,102,241,0.5)',
  error: '0 0 44px 4px rgba(239,68,68,0.5)',
};

const RIPPLE_COLOR = {
  listening: 'rgba(96,165,250,0.6)',
  speaking: 'rgba(129,140,248,0.6)',
};

const ORB_SIZE = 220;
const CORE_SIZE = 188;

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
  const scale = speaking ? 1 + Math.min(level, 1) * 0.4 : 1; // 1.0 → 1.4
  const glow = speaking
    ? `0 0 ${44 + level * 90}px ${4 + level * 18}px rgba(99,102,241,${0.4 + level * 0.5})`
    : STATIC_GLOW[status];

  const orbAnim =
    status === 'idle' || status === 'error'
      ? 'animate-orb-idle'
      : status === 'listening'
        ? 'animate-orb-listen'
        : '';
  const spinning = status === 'thinking' || status === 'connecting';

  const showRipples = status === 'listening' || speaking;
  const rippleColor = RIPPLE_COLOR[status] || 'rgba(99,102,241,0.5)';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: ORB_SIZE, height: ORB_SIZE }}
    >
      {/* Ripple rings emanating outward (more rings while speaking) */}
      {showRipples &&
        (speaking ? [0, 0.45, 0.9, 1.35] : [0, 0.6, 1.2]).map((delay) => (
          <span
            key={delay}
            className="absolute rounded-full border-2 animate-orb-ripple"
            style={{
              width: CORE_SIZE + 12,
              height: CORE_SIZE + 12,
              borderColor: rippleColor,
              animationDelay: `${delay}s`,
            }}
          />
        ))}

      {/* Rotating gradient sweep for the connecting / thinking states */}
      {spinning && (
        <span
          className="absolute rounded-full animate-orb-spin"
          style={{
            width: ORB_SIZE - 6,
            height: ORB_SIZE - 6,
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(245,158,11,0.65) 90deg, transparent 200deg)',
          }}
        />
      )}

      {/* Core orb */}
      <div
        className={`relative rounded-full ${orbAnim}`}
        style={{
          width: CORE_SIZE,
          height: CORE_SIZE,
          background: GRADIENTS[status],
          boxShadow: glow,
          transform: speaking ? `scale(${scale})` : undefined,
          transition: speaking
            ? 'transform 70ms linear, box-shadow 70ms linear'
            : 'all 0.3s ease',
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
          {status === 'listening' ? <Mic size={40} /> : <Sparkles size={40} />}
        </div>
      </div>
    </div>
  );
}
