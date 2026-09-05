import { useState, useEffect } from 'react';
import type { PrismRenderer, BadukGridMetrics } from '../../prism/renderer';

export interface BadukLayoutBounds {
  leftCol: number;
  rightCol: number;
  topRow: number;
  bottomRow: number;
  // Computed CSS styles for left wing (text/story)
  leftWingStyle: React.CSSProperties;
  // Computed CSS styles for right wing (media stage)
  rightWingStyle: React.CSSProperties;
  // Board dimensions
  gridWidth: number;
  gridHeight: number;
  cellWidth: number;
  cellHeight: number;
  ready: boolean;
}

export function useBadukGrid(renderer: PrismRenderer | null): BadukLayoutBounds {
  const [metrics, setMetrics] = useState<BadukGridMetrics | null>(null);

  useEffect(() => {
    if (!renderer?.getBadukGridMetrics) return;

    let animId: number;
    let attempts = 0;

    const update = () => {
      const m = renderer.getBadukGridMetrics?.();
      if (m && m.columns.length === 19 && m.rows.length === 19) {
        setMetrics(m);
      } else if (attempts < 60) {
        attempts++;
        animId = requestAnimationFrame(update);
      }
    };

    update();

    const handleResize = () => {
      update();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Poll periodically during the first few seconds of framing fit
    const interval = setInterval(update, 200);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [renderer]);

  // Fallback if metrics are still computing
  if (!metrics || metrics.columns.length < 19 || metrics.rows.length < 19) {
    return {
      leftCol: 0,
      rightCol: 0,
      topRow: 0,
      bottomRow: 0,
      leftWingStyle: {
        position: 'absolute',
        left: 'calc(50% - min(46vw, 42rem))',
        width: 'min(28vw, 24rem)',
        top: '12vh',
      },
      rightWingStyle: {
        position: 'absolute',
        right: 'calc(50% - min(46vw, 42rem))',
        width: 'min(30vw, 26rem)',
        top: '12vh',
      },
      gridWidth: 0,
      gridHeight: 0,
      cellWidth: 0,
      cellHeight: 0,
      ready: false,
    };
  }

  const { columns, rows, bounds } = metrics;
  // Columns are indexed 0 (-9) to 18 (+9)
  // Rows are indexed 0 (+9 top) to 18 (-9 bottom)

  // Left wing bounds: Column 1 (-8) to Column 6 (-3)
  const leftWingX1 = columns[1] ?? bounds.left;
  const leftWingX2 = columns[6] ?? (bounds.left + bounds.width * 0.35);
  const leftWingY1 = rows[1] ?? bounds.top;
  const leftWingY2 = rows[17] ?? bounds.bottom;

  // Right wing bounds: Column 12 (+3) to Column 17 (+8)
  const rightWingX1 = columns[12] ?? (bounds.left + bounds.width * 0.65);
  const rightWingX2 = columns[17] ?? bounds.right;
  const rightWingY1 = rows[1] ?? bounds.top;
  const rightWingY2 = rows[17] ?? bounds.bottom;

  const cellWidth = columns[1] && columns[0] ? columns[1] - columns[0] : 30;
  const cellHeight = rows[1] && rows[0] ? rows[1] - rows[0] : 32;

  return {
    leftCol: columns[1] ?? 0,
    rightCol: columns[17] ?? 0,
    topRow: rows[1] ?? 0,
    bottomRow: rows[17] ?? 0,
    leftWingStyle: {
      position: 'absolute',
      left: `${Math.round(leftWingX1)}px`,
      width: `${Math.max(280, Math.round(leftWingX2 - leftWingX1))}px`,
      top: `${Math.round(leftWingY1)}px`,
      maxHeight: `${Math.round(leftWingY2 - leftWingY1)}px`,
    },
    rightWingStyle: {
      position: 'absolute',
      left: `${Math.round(rightWingX1)}px`,
      width: `${Math.max(300, Math.round(rightWingX2 - rightWingX1))}px`,
      top: `${Math.round(rightWingY1)}px`,
      maxHeight: `${Math.round(rightWingY2 - rightWingY1)}px`,
    },
    gridWidth: bounds.width,
    gridHeight: bounds.height,
    cellWidth,
    cellHeight,
    ready: true,
  };
}
