import { LocalCatalog } from './catalog';
import { CatalogObject, ObjectType, CatalogType } from './types';

// Match the Telescopius interfaces
export interface LocalCatalogTarget {
  name: string;
  catalogId: string;
  type: string;
  constellation?: string;
  magnitude?: number;
  size?: string;
  distance: number; // in arcminutes from search center
  thumbnailUrl?: string;
  catalogIds: string[];
}

export interface LocalCatalogSearchResult {
  targets: LocalCatalogTarget[];
  searchRadius: number; // in arcminutes
  searchCoordinates: {
    ra: number;
    dec: number;
  };
  totalMatched: number;
}

export class LocalCatalogClient {
  private catalog: LocalCatalog;

  constructor(options?: {
    includeCatalogs?: CatalogType[];
    maxMagnitude?: number;
  }) {
    this.catalog = new LocalCatalog(options);
  }

  /**
   * Search for astronomical targets near given coordinates
   * Matches the Telescopius client interface
   */
  async searchTargets(
    ra: number,
    dec: number,
    radiusDegrees: number = 0.5,
    options: {
      types?: string[]; // DSO types to filter
      catalogs?: string[]; // Specific catalogs (M, NGC, etc)
      magMax?: number; // Maximum magnitude (fainter limit)
    } = {},
  ): Promise<LocalCatalogSearchResult | null> {
    // Validate inputs
    if (!isFinite(ra) || !isFinite(dec) || !isFinite(radiusDegrees)) {
      console.error('Invalid coordinates or radius: must be finite numbers');
      return null;
    }

    if (radiusDegrees < 0 || radiusDegrees > 180) {
      console.error('Invalid radius: must be between 0 and 180 degrees');
      return null;
    }

    if (Math.abs(dec) > 90) {
      console.error('Invalid declination: must be between -90 and 90 degrees');
      return null;
    }

    // Normalize RA to [0, 360)
    ra = ((ra % 360) + 360) % 360;

    try {
      const radiusArcmin = radiusDegrees * 60;

      // Map string types to our ObjectType enum
      const typeFilter = options.types ? this.mapTypesToInternal(options.types) : undefined;
      const catalogFilter = options.catalogs ? options.catalogs as CatalogType[] : undefined;

      const searchResults = await this.catalog.search(
        ra,
        dec,
        radiusArcmin,
        {
          types: typeFilter,
          catalogs: catalogFilter,
          maxMagnitude: options.magMax,
        }
      );

      const targets = searchResults.map(result => this.transformToTarget(result.object, result.distance));

      return {
        targets,
        searchRadius: radiusArcmin,
        searchCoordinates: { ra, dec },
        totalMatched: targets.length,
      };
    } catch (error) {
      console.error('Failed to search local catalog:', error);
      return null;
    }
  }

  /**
   * Transform internal catalog object to match Telescopius format
   */
  private transformToTarget(obj: CatalogObject, distance: number): LocalCatalogTarget {
    // Format size for display
    let sizeStr: string | undefined;
    if (obj.size !== undefined) {
      if (Array.isArray(obj.size)) {
        sizeStr = `${obj.size[0]}'×${obj.size[1]}'`;
      } else {
        sizeStr = `${obj.size}'`;
      }
    }

    return {
      name: obj.names[0] || obj.id,
      catalogId: obj.id,
      type: this.mapObjectTypeToFriendly(obj.type),
      constellation: obj.constellation,
      magnitude: obj.mag,
      size: sizeStr,
      distance,
      thumbnailUrl: undefined, // Local catalog doesn't have thumbnails
      catalogIds: obj.names,
    };
  }

  /**
   * Map Telescopius-style type strings to our internal types
   */
  private mapTypesToInternal(types: string[]): ObjectType[] {
    const typeMap: Record<string, ObjectType[]> = {
      'gal': ['gal'],
      'galaxy': ['gal'],
      'neb': ['neb', 'en', 'rn', 'dn', 'bn'],
      'nebula': ['neb', 'en', 'rn', 'dn', 'bn'],
      'pneb': ['pneb'],
      'planetary': ['pneb'],
      'snr': ['snr'],
      'supernova': ['snr'],
      'oc': ['oc'],
      'open': ['oc'],
      'gc': ['gc'],
      'globular': ['gc'],
      'hii': ['hii'],
      'h2r': ['hii'],
      'star': ['star', 'dstar'],
      'ast': ['ast'],
    };

    const result = new Set<ObjectType>();
    for (const type of types) {
      const mapped = typeMap[type.toLowerCase()];
      if (mapped) {
        mapped.forEach(t => result.add(t));
      }
    }
    return Array.from(result);
  }

  /**
   * Map internal object types to friendly names
   */
  private mapObjectTypeToFriendly(type: ObjectType): string {
    const typeMap: Record<ObjectType, string> = {
      'gal': 'Galaxy',
      'neb': 'Nebula',
      'pneb': 'Planetary Nebula',
      'snr': 'Supernova Remnant',
      'oc': 'Open Cluster',
      'gc': 'Globular Cluster',
      'dn': 'Dark Nebula',
      'en': 'Emission Nebula',
      'rn': 'Reflection Nebula',
      'bn': 'Bright Nebula',
      'hii': 'HII Region',
      'star': 'Star',
      'dstar': 'Double Star',
      'ast': 'Asterism',
      'knot': 'Bright Knot',
      'galaxy_cluster': 'Galaxy Cluster',
      'other': 'Deep Sky Object',
    };

    return typeMap[type] || 'Deep Sky Object';
  }

  /**
   * Get a specific object by ID
   */
  async getObject(id: string): Promise<LocalCatalogTarget | null> {
    const obj = await this.catalog.getObject(id);
    if (!obj) return null;

    return this.transformToTarget(obj, 0);
  }

  /**
   * Get catalog statistics
   */
  async getStats() {
    return this.catalog.getStats();
  }
}