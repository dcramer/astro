"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalCatalogClient = void 0;
const catalog_1 = require("./catalog");
class LocalCatalogClient {
    constructor(options) {
        this.catalog = new catalog_1.LocalCatalog(options);
    }
    /**
     * Search for astronomical targets near given coordinates
     * Matches the Telescopius client interface
     */
    async searchTargets(ra, dec, radiusDegrees = 0.5, options = {}) {
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
            const catalogFilter = options.catalogs ? options.catalogs : undefined;
            const searchResults = await this.catalog.search(ra, dec, radiusArcmin, {
                types: typeFilter,
                catalogs: catalogFilter,
                maxMagnitude: options.magMax,
            });
            const targets = searchResults.map(result => this.transformToTarget(result.object, result.distance));
            return {
                targets,
                searchRadius: radiusArcmin,
                searchCoordinates: { ra, dec },
                totalMatched: targets.length,
            };
        }
        catch (error) {
            console.error('Failed to search local catalog:', error);
            return null;
        }
    }
    /**
     * Transform internal catalog object to match Telescopius format
     */
    transformToTarget(obj, distance) {
        // Format size for display
        let sizeStr;
        if (obj.size !== undefined) {
            if (Array.isArray(obj.size)) {
                sizeStr = `${obj.size[0]}'×${obj.size[1]}'`;
            }
            else {
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
    mapTypesToInternal(types) {
        const typeMap = {
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
        const result = new Set();
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
    mapObjectTypeToFriendly(type) {
        const typeMap = {
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
    async getObject(id) {
        const obj = await this.catalog.getObject(id);
        if (!obj)
            return null;
        return this.transformToTarget(obj, 0);
    }
    /**
     * Get catalog statistics
     */
    async getStats() {
        return this.catalog.getStats();
    }
}
exports.LocalCatalogClient = LocalCatalogClient;
