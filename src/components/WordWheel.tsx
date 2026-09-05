import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Wordscapes/Word Cookies tarzı daire harf tekerleği: harfler bir çember
 * üzerinde duruyor, kullanıcı basılı tutup sürükleyerek harften harfe
 * geçiyor, parmağını kaldırınca seçtiği harfler bir tahmin olarak
 * gönderiliyor. Klasik "kutuya yazı gir" input'undan çok daha oyun
 * hissi veriyor ve dokunmatik ekranda tek elle rahat kullanılıyor.
 *
 * Geometri matematikle hesaplanıyor (DOM sorgusu yok): her harfin çember
 * üzerindeki (x,y) konumu index/toplam sayıya göre belli, sürükleme
 * sırasında parmağın en yakın olduğu harf mesafe hesabıyla bulunuyor.
 * Bu, `elementFromPoint` gibi DOM'a bağımlı yöntemlerden daha güvenilir
 * ve React state'iyle tam uyumlu.
 */

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 100;
const TILE_R = 26;
const HIT_R = 38; // dokunma toleransı -- tile'dan biraz büyük, parmak tam üstüne gelmese de yakalasın

function positionFor(index: number, total: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2; // -90°'den başla (yukarı)
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

interface WordWheelProps {
  letters: string[];
  onSubmit: (selectedIndices: number[]) => void;
  disabled?: boolean;
  gradientFrom: string;
  gradientTo: string;
  tileSelectedClass: string;
}

export default function WordWheel({
  letters,
  onSubmit,
  disabled,
  gradientFrom,
  gradientTo,
  tileSelectedClass,
}: WordWheelProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const positions = useMemo(
    () => letters.map((_, i) => positionFor(i, letters.length)),
    [letters],
  );

  const nearestLetter = useCallback(
    (x: number, y: number) => {
      let best = -1;
      let bestDist = HIT_R;
      positions.forEach((p, i) => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [positions],
  );

  function localPoint(clientX: number, clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * SIZE, y: ((clientY - rect.top) / rect.height) * SIZE };
  }

  function handleDown(i: number, clientX: number, clientY: number) {
    if (disabled) return;
    draggingRef.current = true;
    setSelected([i]);
    setDragPos(localPoint(clientX, clientY));
  }

  function handleMove(clientX: number, clientY: number) {
    if (!draggingRef.current || disabled) return;
    const p = localPoint(clientX, clientY);
    setDragPos(p);
    const hit = nearestLetter(p.x, p.y);
    if (hit === -1) return;
    setSelected((sel) => {
      if (sel[sel.length - 1] === hit) return sel;
      // Bir önceki harfe geri gelindiyse son harfi çıkar -- kaldırmadan düzeltme.
      if (sel.length > 1 && sel[sel.length - 2] === hit) return sel.slice(0, -1);
      if (sel.includes(hit)) return sel;
      return [...sel, hit];
    });
  }

  function handleUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragPos(null);
    if (selected.length > 0) onSubmit(selected);
    setSelected([]);
  }

  const linePoints = selected.map((i) => positions[i]).concat(dragPos ? [dragPos] : []);

  return (
    <div
      ref={containerRef}
      className="relative select-none touch-none"
      style={{ width: SIZE, height: SIZE }}
      onPointerMove={(e) => handleMove(e.clientX, e.clientY)}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    >
      <svg width={SIZE} height={SIZE} className="absolute inset-0 pointer-events-none">
        {linePoints.length > 1 && (
          <polyline
            points={linePoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="url(#wheelGradient)"
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
        )}
        <defs>
          <linearGradient id="wheelGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
      </svg>

      {letters.map((char, i) => {
        const p = positions[i];
        const isSelected = selected.includes(i);
        return (
          <button
            key={i}
            type="button"
            onPointerDown={(e) => handleDown(i, e.clientX, e.clientY)}
            className={`absolute flex items-center justify-center rounded-full font-display font-extrabold uppercase text-xl transition-transform active:scale-95 ${
              isSelected ? `${tileSelectedClass} scale-110` : 'bg-white text-slate-800'
            }`}
            style={{
              width: TILE_R * 2,
              height: TILE_R * 2,
              left: p.x - TILE_R,
              top: p.y - TILE_R,
              // "Fiziksel oyun parçası" hissi: alttan koyu bir kalınlık +
              // üstten hafif parlaklık -- düz gölge yerine gerçek bir
              // butona basıyormuş gibi hissettiriyor.
              boxShadow: isSelected
                ? '0 4px 0 rgba(0,0,0,0.25), 0 6px 14px rgba(0,0,0,0.35)'
                : '0 3px 0 rgba(15,23,42,0.25), inset 0 2px 0 rgba(255,255,255,0.6), 0 4px 10px rgba(0,0,0,0.25)',
            }}
          >
            {char}
          </button>
        );
      })}
    </div>
  );
}
