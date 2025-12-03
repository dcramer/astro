# Test Fixtures

This directory contains captured API responses for testing.

## Astrospheric API Response

### `astrospheric-response-2025-12-02.json`

Real API response captured on December 2, 2025.

**Metadata:**
- **Location**: San Francisco, CA (37.76°, -122.44°)
- **Timezone**: America/Los_Angeles
- **Start Time**: 2025-12-02T13:00:00 (1:00 PM local)
- **Forecast Hours**: 82 hours
- **API Credits Used**: 10/100
- **Model Run**: 2025120218 (December 2, 2025 at 18:00 UTC)

**Data Included:**
- RDPS_CloudCover (Canadian model - high resolution)
- NAM_CloudCover (US model)
- GFS_CloudCover (Global model)
- Astrospheric_Seeing (arc-seconds)
- Astrospheric_Transparency (extinction index)
- RDPS_Temperature (Kelvin)
- RDPS_DewPoint (Kelvin)
- RDPS_WindVelocity
- RAP_ColumnAerosolMass

**Usage:**
```typescript
import fixtureData from './__fixtures__/astrospheric-response-2025-12-02.json';
import { AstrosphericForecastResponseSchema } from './astrospheric';

// Validate the fixture
const validated = AstrosphericForecastResponseSchema.parse(fixtureData);
```

**Captured with:**
```bash
curl -X POST https://astrosphericpublicaccess.azurewebsites.net/api/GetForecastData_V1 \
  -H "Content-Type: application/json" \
  -d '{"APIKey":"...","Latitude":37.7576548,"Longitude":-122.4353989}'
```
