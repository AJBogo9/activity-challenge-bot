// Ultra-lightweight SVG chart generators

export function renderLineChart(data: number[], height: number = 200, color: string = '#FF8042') {
  if (!data || data.length === 0) return '<div class="text-center text-hint p-4">No data</div>';
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100; // viewbox units
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const normalizedY = ((val - min) / range) * height; 
    return `${x},${normalizedY}`;
  }).join(' ');

  return `
    <svg viewBox="0 0 100 ${height}" preserveAspectRatio="none" style="width: 100%; height: ${height}px; overflow: visible;">
      <polyline
        fill="none"
        stroke="${color}"
        stroke-width="2"
        points="${points}"
        vector-effect="non-scaling-stroke"
      />
      ${data.map((val, i) => {
         const x = (i / (data.length - 1)) * 100;
         const y = ((val - min) / range) * height;
         return `<circle cx="${x}" cy="${y}" r="3" fill="${color}" vector-effect="non-scaling-stroke"/>`;
      }).join('')}
    </svg>
  `;
}

export function renderMultiLineChart(series: { name: string, data: number[], color: string }[], height: number = 200) {
    if (!series || series.length === 0) return '<div class="text-center text-hint p-4">No data</div>';
    
    // Find global min/max
    const allValues = series.flatMap(s => s.data);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    const range = max - min || 1;
    const width = 100;

    const lines = series.map(s => {
        const points = s.data.map((val, i) => {
            const x = (i / (s.data.length - 1)) * width;
            // Rank: 1 is top (y=0), Higher number is bottom (y=height).
            // So y = ((val - min) / range) * height maps min->0, max->height.
            // But if 'val' is RANK, min=1 (BEST), max=10 (WORST).
            // So we want min at 0, max at height. Correct.
            const y = ((val - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');
        
        return `
            <polyline
                fill="none"
                stroke="${s.color}"
                stroke-width="2"
                points="${points}"
                vector-effect="non-scaling-stroke"
                opacity="0.8"
            />
        `;
    }).join('');
    
    // Legend
    const legend = `
      <div class="mt-4 flex flex-wrap justify-center gap-4">
        ${series.map(s => `
          <div class="flex items-center gap-2">
            <span style="width: 10px; height: 10px; background-color: ${s.color}; border-radius: 50%; display: inline-block;"></span>
            <span class="text-xs font-bold">${s.name}</span>
          </div>
        `).join('')}
      </div>
    `;

    return `
      <div class="flex flex-col">
          <svg viewBox="0 0 100 ${height}" preserveAspectRatio="none" style="width: 100%; height: ${height}px; overflow: visible;">
            ${lines}
          </svg>
          ${legend}
      </div>
    `;
}

export function renderDonutChart(data: { name: string, value: number, color: string }[], size: number = 200) {
    if (!data || data.length === 0) return '<div class="text-center text-hint p-4">No data</div>';

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const center = size / 2;
    const radius = size / 2;
    const holeRadius = size * 0.35; // 70% diameter hole = 35% radius

    const slices = data.map(item => {
        const angle = (item.value / total) * 360;
        const x1 = center + radius * Math.cos(Math.PI * currentAngle / 180);
        const y1 = center + radius * Math.sin(Math.PI * currentAngle / 180);
        const x2 = center + radius * Math.cos(Math.PI * (currentAngle + angle) / 180);
        const y2 = center + radius * Math.sin(Math.PI * (currentAngle + angle) / 180);
        
        // Large arc flag
        const largeArc = angle > 180 ? 1 : 0;
        
        const pathData = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            `Z`
        ].join(' ');

        const slice = `<path d="${pathData}" fill="${item.color}" />`;
        currentAngle += angle;
        return slice;
    }).join('');
    
    // Create hole
    const hole = `<circle cx="${center}" cy="${center}" r="${holeRadius}" fill="var(--tg-theme-bg-color)" />`;
    
    // Legend
    const legend = `
      <div class="mt-4 flex flex-wrap justify-center gap-4">
        ${data.map(item => `
          <div class="flex items-center gap-2">
            <span style="width: 10px; height: 10px; background-color: ${item.color}; border-radius: 50%; display: inline-block;"></span>
            <span class="text-xs font-bold">${item.name}</span>
          </div>
        `).join('')}
      </div>
    `;

    return `
      <div class="flex flex-col items-center">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
          ${slices}
          ${hole}
        </svg>
        ${legend}
      </div>
    `;
}
