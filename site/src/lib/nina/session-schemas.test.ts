import assert from "node:assert/strict";
import test from "node:test";

import { ninaSessionHistorySchema } from "./session-schemas";

test("ninaSessionHistorySchema treats string NaN telemetry as missing", () => {
  const parsed = ninaSessionHistorySchema.parse({
    id: "session-1",
    pluginVersion: "2.2.1.0",
    sessionVersion: 16,
    startTime: "2026-05-30T23:17:01.3855228-07:00",
    profileName: "Production",
    activeSession: true,
    activeTargetId: "target-1",
    targets: [
      {
        id: "target-1",
        name: "M 13",
        startTime: "2026-05-30T23:17:01.3855228-07:00",
        imageRecords: [
          {
            id: "image-1",
            index: 1,
            fileName: "M 13_0000.fits",
            fullPath: "C:\\Images\\M 13_0000.fits",
            started: "2026-05-31T06:11:52.8278754Z",
            epochMilliseconds: 1780207912827,
            duration: 300,
            filterName: "Sii",
            detectedStars: 257,
            HFR: 1.8,
            FocuserTemperature: 11.3,
            WeatherTemperature: "NaN",
            GuidingRMS: 0,
          },
        ],
      },
    ],
  });

  assert.equal(parsed.targets?.[0]?.imageRecords?.[0]?.WeatherTemperature, undefined);
});
