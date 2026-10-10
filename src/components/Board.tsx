import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { COLS, ROWS, itemDef } from '../game/config';
import { canMerge, type Cell } from '../game/logic';
import { IMG } from '../game/assets';
import { sfx } from '../game/audio';
import { Sprite } from './Sprite';

export interface BoardEffect {
  key: number;
  index: number;
  kind: 'merge' | 'spawn';
}

interface Props {
  board: Cell[];
  cellSize: number;
  locked: boolean;
  freshIds: ReadonlySet<number>;
  effects: BoardEffect[];
  hint: [number, number] | null;
  guide: [number, number] | null;
  onMove: (from: number, to: number) => void;
  onInteract: () => void;
}

interface DragInfo {
  from: number;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
}

const DRAG_THRESHOLD = 6;
const ITEM_EMOJI = ['🌰', '🌱', '🌿', '🌷', '🌼', '🌻', '💐'];

export function Board({ board, cellSize, locked, freshIds, effects, hint, guide, onMove, onInteract }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  // Si el objeto seleccionado desaparece (p. ej. tras combinar), se limpia la selección.
  if (selected !== null && !board[selected]) setSelected(null);

  const indexAt = (x: number, y: number): number => {
    const el = gridRef.current;
    if (!el) return -1;
    const r = el.getBoundingClientRect();
    if (x < r.left || x >= r.right || y < r.top || y >= r.bottom) return -1;
    const col = Math.floor(((x - r.left) / r.width) * COLS);
    const row = Math.floor(((y - r.top) / r.height) * ROWS);
    return row * COLS + col;
  };

  const placeGhost = () => {
    const d = dragRef.current;
    const g = ghostRef.current;
    if (!d || !g) return;
    const size = cellSize * 1.15;
    g.style.transform = `translate3d(${d.x - size / 2}px, ${d.y - size * 0.7}px, 0)`;
  };

  useLayoutEffect(placeGhost, [dragFrom]);

  const endDrag = () => {
    dragRef.current = null;
    setDragFrom(null);
    setHover(null);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (locked || dragRef.current) return;
    onInteract();
    const idx = indexAt(e.clientX, e.clientY);
    if (idx < 0) return;
    if (!board[idx]) {
      if (selected !== null) {
        onMove(selected, idx);
        setSelected(null);
      }
      return;
    }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      from: idx,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      active: false,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    d.x = e.clientX;
    d.y = e.clientY;
    if (!d.active) {
      if (Math.hypot(d.x - d.startX, d.y - d.startY) < DRAG_THRESHOLD) return;
      d.active = true;
      setSelected(null);
      setDragFrom(d.from);
      sfx.pick();
    }
    placeGhost();
    const idx = indexAt(d.x, d.y);
    setHover((h) => (h === idx ? h : idx));
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (d.active) {
      const target = indexAt(e.clientX, e.clientY);
      if (target >= 0 && target !== d.from) onMove(d.from, target);
      else sfx.drop();
    } else {
      // Toque sin arrastre: seleccionar y luego tocar el destino.
      if (selected === null) setSelected(d.from);
      else if (selected === d.from) setSelected(null);
      else {
        onMove(selected, d.from);
        setSelected(null);
      }
    }
    endDrag();
  };

  const dragItem = dragFrom !== null ? board[dragFrom] : null;
  const width = cellSize * COLS;
  const height = cellSize * ROWS;

  let guideStyle: CSSProperties | undefined;
  if (guide) {
    const pos = (i: number) => [(i % COLS) * cellSize + cellSize * 0.55, Math.floor(i / COLS) * cellSize + cellSize * 0.55];
    const [fx, fy] = pos(guide[0]);
    const [tx, ty] = pos(guide[1]);
    guideStyle = { '--fx': `${fx}px`, '--fy': `${fy}px`, '--tx': `${tx}px`, '--ty': `${ty}px` } as CSSProperties;
  }

  return (
    <div className="board-frame" style={{ width: width + 16, height: height + 16 }}>
      <div
        ref={gridRef}
        className={`board ${locked ? 'locked' : ''}`}
        style={{ width, height, '--cell': `${cellSize}px` } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={endDrag}
        onLostPointerCapture={(e) => {
          if (dragRef.current?.pointerId === e.pointerId) endDrag();
        }}
        role="grid"
        aria-label="Tablero del jardín"
      >
        {board.map((cell, i) => {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          const isDragSource = dragFrom === i;
          const isHover = hover === i && dragFrom !== null && hover !== dragFrom;
          const mergeable = isHover && canMerge(dragItem, cell);
          const classes = [
            'cell',
            (row + col) % 2 ? 'alt' : '',
            isHover ? (mergeable ? 'target-merge' : 'target') : '',
            selected === i ? 'selected' : '',
            hint && (hint[0] === i || hint[1] === i) ? 'hint' : '',
          ].join(' ');
          return (
            <div key={i} className={classes} role="gridcell">
              {cell && (
                <Sprite
                  key={cell.id}
                  src={itemDef(cell.level).sprite}
                  alt={itemDef(cell.level).name}
                  fallback={ITEM_EMOJI[cell.level - 1]}
                  className={`item lvl-${cell.level} ${freshIds.has(cell.id) ? 'fresh' : ''} ${isDragSource ? 'dragging-source' : ''}`}
                />
              )}
            </div>
          );
        })}

        {effects.map((fx) => (
          <div
            key={fx.key}
            className={`fx fx-${fx.kind}`}
            style={{ left: (fx.index % COLS) * cellSize, top: Math.floor(fx.index / COLS) * cellSize, width: cellSize, height: cellSize }}
          >
            <Sprite src={IMG.brillo1} alt="" className="spark s1" fallback="✨" />
            <Sprite src={IMG.brillo2} alt="" className="spark s2" fallback="✨" />
            <Sprite src={IMG.brillo3} alt="" className="spark s3" fallback="✨" />
            {fx.kind === 'merge' && <Sprite src={IMG.fxCorazon} alt="" className="spark s4" fallback="💛" />}
            <div className="ring" />
          </div>
        ))}

        {guide && (
          <div className="guide-hand" style={guideStyle} aria-hidden>
            👆
          </div>
        )}
      </div>

      {dragItem &&
        createPortal(
          <div ref={ghostRef} className="drag-ghost" style={{ width: cellSize * 1.15, height: cellSize * 1.15 }}>
            <Sprite src={itemDef(dragItem.level).sprite} alt="" fallback={ITEM_EMOJI[dragItem.level - 1]} className="item" />
          </div>,
          document.body,
        )}
    </div>
  );
}
