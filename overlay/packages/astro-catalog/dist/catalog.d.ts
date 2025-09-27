import { CatalogObject, ObjectType, SearchOptions, SearchResult, CatalogType } from './types';
export declare class LocalCatalog {
    private options;
    private catalog;
    private loaded;
    private indexByRA;
    constructor(options?: {
        includeCatalogs?: CatalogType[];
        maxMagnitude?: number;
    });
    initialize(): Promise<void>;
    private buildSpatialIndex;
    /**
     * Search for objects within a radius of given coordinates
     */
    search(ra: number, dec: number, radiusArcmin: number, options?: SearchOptions): Promise<SearchResult[]>;
    private passesFilters;
    /**
     * Get a specific object by its ID
     */
    getObject(id: string): Promise<CatalogObject | undefined>;
    /**
     * Get all loaded objects
     */
    getAllObjects(): Promise<CatalogObject[]>;
    /**
     * Get catalog statistics
     */
    getStats(): Promise<{
        catalogs: CatalogType[];
        totalObjects: number;
        objectsByType: Record<ObjectType, number>;
        magnitudeRange: [number, number];
    }>;
}
//# sourceMappingURL=catalog.d.ts.map