import { CatalogObject, ObjectType, SearchOptions, SearchResult, CatalogType } from './types';
import { calculateAngularDistance, isInRadius, normalizeRA } from './utils/coordinates';
import { messierCatalog } from './data/messier';
import { sharplessCatalog } from './data/sharpless';
import { ngcIcBrightCatalog } from './data/ngc-ic-bright';

export class LocalCatalog {
  private catalog: CatalogObject[] = [];
  private loaded: boolean = false;
  private indexByRA: Map<number, CatalogObject[]> = new Map();

  constructor(private options: {
    includeCatalogs?: CatalogType[];
    maxMagnitude?: number;
  } = {}) {}

  async initialize(): Promise<void> {
    if (this.loaded) return;

    const { includeCatalogs, maxMagnitude } = this.options;

    // Load catalogs
    const catalogs: CatalogObject[] = [];

    if (!includeCatalogs || includeCatalogs.includes('M')) {
      catalogs.push(...messierCatalog);
    }

    if (!includeCatalogs || includeCatalogs.includes('SH2')) {
      catalogs.push(...sharplessCatalog);
    }

    if (!includeCatalogs || includeCatalogs.includes('NGC') || includeCatalogs.includes('IC')) {
      const filtered = ngcIcBrightCatalog.filter(obj => {
        if (includeCatalogs) {
          return includeCatalogs.includes(obj.catalog);
        }
        return true;
      });
      catalogs.push(...filtered);
    }

    // Filter by magnitude if specified
    if (maxMagnitude !== undefined) {
      this.catalog = catalogs.filter(obj =>
        obj.mag === undefined || obj.mag <= maxMagnitude
      );
    } else {
      this.catalog = catalogs;
    }

    // Build spatial index (simple RA-based for now)
    this.buildSpatialIndex();

    this.loaded = true;
  }

  private buildSpatialIndex(): void {
    // Group objects into 10-degree RA bins for faster searching
    this.catalog.forEach(obj => {
      const raBin = Math.floor(obj.ra / 10) * 10;
      if (!this.indexByRA.has(raBin)) {
        this.indexByRA.set(raBin, []);
      }
      this.indexByRA.get(raBin)!.push(obj);
    });
  }

  /**
   * Search for objects within a radius of given coordinates
   */
  async search(
    ra: number,
    dec: number,
    radiusArcmin: number,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!this.loaded) {
      await this.initialize();
    }

    // Normalize coordinates
    ra = normalizeRA(ra);
    dec = Math.max(-90, Math.min(90, dec));

    const results: SearchResult[] = [];

    // Calculate which RA bins to search
    // Account for cos(dec) factor in RA spread
    const cosDec = Math.cos(dec * Math.PI / 180);
    const raSpread = cosDec > 0.01 ? Math.min(radiusArcmin / 60 / cosDec, 180) : 180;

    // Collect all bins to search (handles wraparound automatically)
    const binsToSearch = new Set<number>();
    const minRA = ra - raSpread;
    const maxRA = ra + raSpread;

    // Add bins in the search range
    for (let binRA = Math.floor(minRA / 10) * 10; binRA <= Math.ceil(maxRA / 10) * 10; binRA += 10) {
      const normalizedBin = ((binRA % 360) + 360) % 360;
      binsToSearch.add(Math.floor(normalizedBin / 10) * 10);
    }

    // Search all collected bins
    for (const binKey of binsToSearch) {
      const binObjects = this.indexByRA.get(binKey) || [];

      for (const obj of binObjects) {
        // Quick rectangular filter before expensive distance calc
        const raDiff = Math.abs(obj.ra - ra);
        const wrappedRaDiff = Math.min(raDiff, 360 - raDiff);
        if (wrappedRaDiff * cosDec > raSpread) {
          continue;
        }

        // Check if object is within radius
        if (!isInRadius(obj.ra, obj.dec, ra, dec, radiusArcmin)) {
          continue;
        }

        // Apply filters
        if (!this.passesFilters(obj, options)) {
          continue;
        }

        const distance = calculateAngularDistance(ra, dec, obj.ra, obj.dec);
        results.push({ object: obj, distance });
      }
    }

    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);

    return results;
  }

  private passesFilters(obj: CatalogObject, options: SearchOptions): boolean {
    if (options.maxMagnitude !== undefined && obj.mag !== undefined && obj.mag > options.maxMagnitude) {
      return false;
    }

    if (options.minSize !== undefined) {
      const size = Array.isArray(obj.size) ? Math.max(...obj.size) : obj.size;
      if (size !== undefined && size < options.minSize) {
        return false;
      }
    }

    if (options.types && options.types.length > 0 && !options.types.includes(obj.type)) {
      return false;
    }

    if (options.catalogs && options.catalogs.length > 0 && !options.catalogs.includes(obj.catalog)) {
      return false;
    }

    if (options.constellation && obj.constellation !== options.constellation) {
      return false;
    }

    return true;
  }

  /**
   * Get a specific object by its ID
   */
  async getObject(id: string): Promise<CatalogObject | undefined> {
    if (!this.loaded) {
      await this.initialize();
    }

    return this.catalog.find(obj =>
      obj.id === id || obj.names.includes(id)
    );
  }

  /**
   * Get all loaded objects
   */
  async getAllObjects(): Promise<CatalogObject[]> {
    if (!this.loaded) {
      await this.initialize();
    }

    return [...this.catalog];
  }

  /**
   * Get catalog statistics
   */
  async getStats() {
    if (!this.loaded) {
      await this.initialize();
    }

    const stats = {
      totalObjects: this.catalog.length,
      objectsByType: {} as Record<ObjectType, number>,
      magnitudeRange: [Infinity, -Infinity] as [number, number],
      catalogs: new Set<CatalogType>()
    };

    for (const obj of this.catalog) {
      // Count by type
      stats.objectsByType[obj.type] = (stats.objectsByType[obj.type] || 0) + 1;

      // Track magnitude range
      if (obj.mag !== undefined) {
        stats.magnitudeRange[0] = Math.min(stats.magnitudeRange[0], obj.mag);
        stats.magnitudeRange[1] = Math.max(stats.magnitudeRange[1], obj.mag);
      }

      // Track catalogs
      stats.catalogs.add(obj.catalog);
    }

    return {
      ...stats,
      catalogs: Array.from(stats.catalogs)
    };
  }
}