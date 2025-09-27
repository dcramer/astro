export interface CatalogObject {
  id: string;
  ra: number;
  dec: number;
  mag?: number;
  type: ObjectType;
  size?: [number, number] | number;
  names: string[];
  constellation?: string;
  surfaceBrightness?: number;
  catalog: CatalogType;
}

export type ObjectType =
  | 'gal'     // Galaxy
  | 'neb'     // Generic nebula
  | 'pneb'    // Planetary nebula
  | 'snr'     // Supernova remnant
  | 'oc'      // Open cluster
  | 'gc'      // Globular cluster
  | 'dn'      // Dark nebula
  | 'en'      // Emission nebula
  | 'rn'      // Reflection nebula
  | 'bn'      // Bright nebula (emission + reflection)
  | 'hii'     // HII region
  | 'star'    // Single star
  | 'dstar'   // Double/multiple star
  | 'ast'     // Asterism
  | 'knot'    // Bright knot
  | 'galaxy_cluster' // Galaxy cluster
  | 'other';

export type CatalogType = 'M' | 'NGC' | 'IC' | 'SH2' | 'B' | 'LDN' | 'LBN' | 'Abell' | 'Cr' | 'Mel' | 'Stock' | 'Tr' | 'Berkeley';

export interface SearchOptions {
  maxMagnitude?: number;
  minSize?: number;
  types?: ObjectType[];
  catalogs?: CatalogType[];
  constellation?: string;
}

export interface SearchResult {
  object: CatalogObject;
  distance: number;
}

export interface CatalogStats {
  totalObjects: number;
  objectsByType: Record<ObjectType, number>;
  magnitudeRange: [number, number];
  catalogs: CatalogType[];
}