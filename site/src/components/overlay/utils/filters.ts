export function getFilterColor(filterName: string | null | undefined): string | null {
  if (!filterName) return null;

  const filter = filterName.trim().toLowerCase();

  // RGB filters
  if (filter === 'r' || filter === 'red') return '#ff4444';
  if (filter === 'g' || filter === 'green') return '#44ff44';
  if (filter === 'b' || filter === 'blue') return '#4444ff';

  // Luminance
  if (filter === 'l' || filter === 'lum' || filter === 'luminance') return '#ffffff';

  // Narrowband filters (wavelength-accurate colors)
  if (filter === 'ha' || filter === 'h-alpha' || filter === 'halpha') return '#ff4444';  // 656nm - red
  if (filter === 'sii' || filter === 's2' || filter === 'sulfur') return '#aa0000';  // 672nm - deep red
  if (filter === 'oiii' || filter === 'o3' || filter === 'oxygen') return '#00ddcc';  // 500nm - teal/cyan

  return null;
}