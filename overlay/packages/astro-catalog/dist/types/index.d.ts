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
export type ObjectType = 'gal' | 'neb' | 'pneb' | 'snr' | 'oc' | 'gc' | 'dn' | 'en' | 'rn' | 'bn' | 'hii' | 'star' | 'dstar' | 'ast' | 'knot' | 'galaxy_cluster' | 'other';
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
//# sourceMappingURL=index.d.ts.map