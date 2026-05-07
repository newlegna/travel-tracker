import { describe, expect, it } from "vitest";
import { parseTimelineJson } from "./timeline-parser";

describe("parseTimelineJson", () => {
  it("parses old Google Timeline placeVisit objects", () => {
    const parsed = parseTimelineJson(
      JSON.stringify({
        timelineObjects: [
          {
            placeVisit: {
              location: {
                latitudeE7: 356810000,
                longitudeE7: 1397670000,
                name: "Tokyo Station",
                placeId: "tokyo-station",
              },
              duration: {
                startTimestamp: "2022-04-01T10:00:00Z",
                endTimestamp: "2022-04-01T12:00:00Z",
              },
            },
          },
          { activitySegment: {} },
        ],
      }),
      "Timeline.json",
    );

    expect(parsed.format).toBe("old-google-timeline");
    expect(parsed.visits).toHaveLength(1);
    expect(parsed.visits[0]).toMatchObject({
      lat: 35.681,
      lng: 139.767,
      arrivedAt: "2022-04-01T10:00:00.000Z",
      departedAt: "2022-04-01T12:00:00.000Z",
      googlePlaceId: "tokyo-station",
      displayName: "Tokyo Station",
    });
  });

  it("parses new Google Timeline visit records", () => {
    const parsed = parseTimelineJson(
      JSON.stringify([
        {
          startTime: "2023-08-03T09:30:00Z",
          endTime: "2023-08-03T11:30:00Z",
          visit: {
            topCandidate: {
              placeLocation: "geo:48.8584,2.2945",
              placeId: "eiffel-tower",
              placeName: "Eiffel Tower",
            },
          },
        },
        { activity: {} },
        { timelinePath: [] },
      ]),
      "2023_AUGUST.json",
    );

    expect(parsed.format).toBe("new-google-timeline");
    expect(parsed.visits).toHaveLength(1);
    expect(parsed.visits[0]).toMatchObject({
      lat: 48.8584,
      lng: 2.2945,
      arrivedAt: "2023-08-03T09:30:00.000Z",
      departedAt: "2023-08-03T11:30:00.000Z",
      googlePlaceId: "eiffel-tower",
      displayName: "Eiffel Tower",
    });
  });
});
