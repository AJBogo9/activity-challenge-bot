/**
 * Modern, clean SVG Charts for Telegram WebApp
 */

const THEME = {
  grid: 'var(--tg-theme-hint-color)',
  text: 'var(--tg-theme-hint-color)',
  bg: 'var(--tg-theme-bg-color)',
  accent: 'var(--tg-theme-link-color)',
  indicator: 'var(--tg-theme-button-color)',
};

function formatLabel(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

/**
 * Optimized interaction handler
 */
function handleInteraction(e: MouseEvent | TouchEvent) {
  const isTouch = 'touches' in e;
  const clientX = isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
  const clientY = isTouch ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
  
  const target = document.elementFromPoint(clientX, clientY) as HTMLElement;
  const zone = target?.closest('.chart-hit-zone') as HTMLElement;
  const container = target?.closest('.chart-container') as HTMLElement;

  if (!zone || !container) {
    document.querySelectorAll('.chart-tooltip, .chart-indicator').forEach((el: any) => {
      el.style.opacity = '0';
    });
    return;
  }

  if (isTouch && e.cancelable) e.preventDefault();

  const tooltip = container.querySelector('.chart-tooltip') as HTMLElement;
  const indicator = container.querySelector('.chart-indicator') as SVGLineElement;
  if (!tooltip || !indicator) return;

  const date = zone.dataset.date;
  const values = JSON.parse(zone.dataset.values || '[]');
  const x = parseFloat(zone.getAttribute('x') || '0');
  const width = parseFloat(zone.getAttribute('width') || '0');
  const centerX = x + width / 2;

  indicator.setAttribute('x1', centerX.toString());
  indicator.setAttribute('x2', centerX.toString());
  indicator.style.opacity = '1';

  let html = `<div style="font-weight:bold; border-bottom:1px solid rgba(255,255,255,0.2); margin-bottom:4px; padding-bottom:2px; text-align:center">${date}</div>`;
  values.forEach((v: any) => {
    html += `<div style="display:flex; justify-content:space-between; gap:12px;">`;
    if (v.name) html += `<span style="opacity:0.7">${v.name}:</span>`;
    html += `<span style="font-weight:bold">#${v.val}</span></div>`;
  });

  tooltip.innerHTML = html;
  tooltip.style.opacity = '1';

  const rect = container.getBoundingClientRect();
  const relX = (centerX / 400) * rect.width;
  if (relX > rect.width / 2) {
    tooltip.style.left = 'auto';
    tooltip.style.right = (rect.width - relX + 10) + 'px';
  } else {
    tooltip.style.right = 'auto';
    tooltip.style.left = (relX + 10) + 'px';
  }
}

// Global listeners optimized
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    if ((e.target as HTMLElement)?.closest('.chart-container')) handleInteraction(e);
    else {
        document.querySelectorAll('.chart-tooltip, .chart-indicator').forEach((el: any) => el.style.opacity = '0');
    }
  });
  window.addEventListener('touchmove', handleInteraction, { passive: false });
  window.addEventListener('touchend', () => {
    document.querySelectorAll('.chart-tooltip, .chart-indicator').forEach((el: any) => el.style.opacity = '0');
  });
}

export function renderRankingChart(config: {
  series: { name?: string; data: number[]; color: string }[];
  labels: string[];
  height?: number;
  isMulti?: boolean;
}) {
  const { series, labels, height = 220 } = config;
  if (!series || series.length === 0 || series[0].data.length === 0) {
    return '<div class="text-center p-8 text-hint opacity-50 font-medium">No data available yet</div>';
  }

  const padding = { top: 20, right: 10, bottom: 50, left: 45 };
  const viewWidth = 400;
  const viewHeight = height;
  const graphWidth = viewWidth - padding.left - padding.right;
  const graphHeight = viewHeight - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.data);
  const minRank = Math.min(...allValues);
  const maxRank = Math.max(...allValues);
  const rankRange = maxRank - minRank || 1;
  const yMin = minRank - rankRange * 0.1;
  const yMax = maxRank + rankRange * 0.1;
  const yRange = yMax - yMin;

  const dataCount = labels.length;
  const xStep = dataCount > 1 ? graphWidth / (dataCount - 1) : graphWidth / 2;

  let gridHtml = '';
  let xLabelsHtml = '';
  let touchZonesHtml = '';
  
  labels.forEach((label, i) => {
    const x = padding.left + (dataCount > 1 ? i * xStep : graphWidth / 2);
    gridHtml += `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + graphHeight}" stroke="${THEME.grid}" stroke-width="0.5" stroke-opacity="0.1" />`;
    xLabelsHtml += `<text x="${x}" y="${padding.top + graphHeight + 12}" fill="${THEME.text}" font-size="8" font-weight="600" text-anchor="end" transform="rotate(-45, ${x}, ${padding.top + graphHeight + 12})">${formatLabel(label)}</text>`;
    const zoneWidth = dataCount > 1 ? graphWidth / (dataCount - 1) : graphWidth;
    touchZonesHtml += `<rect class="chart-hit-zone" x="${x - zoneWidth / 2}" y="${padding.top}" width="${zoneWidth}" height="${graphHeight}" fill="transparent" data-date="${formatLabel(label)}" data-values='${JSON.stringify(series.map(s => ({ name: s.name, val: s.data[i], color: s.color })))}' />`;
  });

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (i * graphHeight) / 4;
    const rankVal = Math.round(yMin + (i * yRange) / 4);
    gridHtml += `<line x1="${padding.left}" y1="${y}" x2="${viewWidth - padding.right}" y2="${y}" stroke="${THEME.grid}" stroke-width="0.5" stroke-opacity="0.1" />`;
    gridHtml += `<text x="${padding.left - 8}" y="${y + 3}" fill="${THEME.text}" font-size="9" font-weight="bold" text-anchor="end">#${rankVal}</text>`;
  }

  const linesHtml = series.map((s) => {
    const points = s.data.map((val, i) => {
      const x = padding.left + (dataCount > 1 ? i * xStep : graphWidth / 2);
      const y = padding.top + ((val - yMin) / yRange) * graphHeight;
      return `${x},${y}`;
    });
    return `<path d="M ${points.join(' L ')}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />` +
           points.map((p) => {
             const [px, py] = p.split(',');
             return `<circle cx="${px}" cy="${py}" r="2.5" fill="${THEME.bg}" stroke="${s.color}" stroke-width="1.5" />`;
           }).join('');
  }).join('');

  return `
    <div class="chart-container w-full relative overflow-visible select-none">
      <style>
        .chart-tooltip {
            position: absolute; top: 10px; background: rgba(0, 0, 0, 0.85); color: white;
            padding: 8px 12px; border-radius: 8px; font-size: 11px; pointer-events: none;
            opacity: 0; transition: opacity 0.15s; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            min-width: 100px; backdrop-filter: blur(4px);
        }
        .chart-indicator { transition: opacity 0.1s; pointer-events: none; }
      </style>
      <div class="chart-tooltip"></div>
      <svg viewBox="0 0 ${viewWidth} ${viewHeight}" class="w-full h-auto" style="display: block; font-family: inherit; overflow: visible;">
        ${gridHtml}
        <line class="chart-indicator" x1="0" y1="${padding.top}" x2="0" y2="${padding.top + graphHeight}" stroke="${THEME.indicator}" stroke-width="1.5" stroke-opacity="0.8" style="opacity: 0" />
        ${linesHtml}
        ${xLabelsHtml}
        ${touchZonesHtml}
      </svg>
      ${config.isMulti ? `<div class="mt-6 px-2 flex flex-wrap justify-center gap-2">${series.map(s => `<div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--tg-theme-secondary-bg-color)] border border-[var(--tg-theme-hint-color)] border-opacity-10"><div style="width: 8px; height: 8px; background-color: ${s.color}; border-radius: 50%;"></div><span class="text-[9px] font-bold uppercase tracking-tight opacity-90 whitespace-nowrap">${s.name}</span></div>`).join('')}</div>` : ''}
    </div>
  `;
}

export function renderLineChart(data: number[], labels: string[] = [], height: number = 220, color: string = THEME.accent) {
  return renderRankingChart({ series: [{ data, color }], labels, height });
}

export function renderMultiLineChart(series: { name: string, data: number[], color: string }[], labels: string[] = [], height: number = 240) {
  return renderRankingChart({ series, labels, height, isMulti: true });
}

export function renderDonutChart(data: { name: string, value: number, color: string }[], size: number = 180) {
  if (!data || data.length === 0) return '';
  const total = data.reduce((s, i) => s + i.value, 0);
  const circumference = 2 * Math.PI * 70;
  let offset = 0;
  return `
    <div class="flex flex-col items-center">
      <svg width="${size}" height="${size}" viewBox="0 0 200 200">
        ${data.map(item => {
          const dash = (item.value / total) * circumference;
          const currentOffset = offset; offset -= dash;
          return `<circle cx="100" cy="100" r="70" fill="none" stroke="${item.color}" stroke-width="25" stroke-dasharray="${dash} ${circumference}" stroke-dashoffset="${currentOffset}" transform="rotate(-90 100 100)" />`;
        }).join('')}
        <text x="100" y="105" text-anchor="middle" fill="${THEME.text}" font-size="16" font-weight="900" opacity="0.5">MIX</text>
      </svg>
      <div class="w-full px-4 grid grid-cols-2 gap-x-6 gap-y-2 mt-4">${data.map(item => `<div class="flex items-center justify-between"><div class="flex items-center gap-2"><div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color}"></div><span class="text-[10px] font-bold opacity-60 uppercase">${item.name}</span></div><span class="text-[10px] font-mono font-bold">${Math.round((item.value/total)*100)}%</span></div>`).join('')}</div>
    </div>
  `;
}

export function renderSparkline(data: number[], color: string = THEME.accent) {
  if (!data || data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 20;
  const width = 60;
  const points = data.map((val, i) => `${(i / (data.length - 1)) * width},${((val - min) / range) * height}`).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}" style="width: ${width}px; height: ${height}px; overflow: visible;"><polyline fill="none" stroke="${color}" stroke-width="2" points="${points}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity="0.5" /></svg>`;
}
