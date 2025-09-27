import { ObjectType, CatalogType } from './types';
export interface LocalCatalogTarget {
    name: string;
    catalogId: string;
    type: string;
    constellation?: string;
    magnitude?: number;
    size?: string;
    distance: number;
    thumbnailUrl?: string;
    catalogIds: string[];
}
export interface LocalCatalogSearchResult {
    targets: LocalCatalogTarget[];
    searchRadius: number;
    searchCoordinates: {
        ra: number;
        dec: number;
    };
    totalMatched: number;
}
export declare class LocalCatalogClient {
    private catalog;
    constructor(options?: {
        includeCatalogs?: CatalogType[];
        maxMagnitude?: number;
    });
    /**
     * Search for astronomical targets near given coordinates
     * Matches the Telescopius client interface
     */
    searchTargets(ra: number, dec: number, radiusDegrees?: number, options?: {
        types?: string[];
        catalogs?: string[];
        magMax?: number;
    }): Promise<LocalCatalogSearchResult | null>;
    /**
     * Transform internal catalog object to match Telescopius format
     */
    private transformToTarget;
    /**
     * Map Telescopius-style type strings to our internal types
     */
    private mapTypesToInternal;
    /**
     * Map internal object types to friendly names
     */
    private mapObjectTypeToFriendly;
    /**
     * Get a specific object by ID
     */
    getObject(id: string): Promise<LocalCatalogTarget | null>;
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
//# sourceMappingURL=client.d.ts.map