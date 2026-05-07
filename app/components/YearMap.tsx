"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export type MapPoint = {
  lat: number;
  lng: number;
  label?: string;
};

type YearMapProps = {
  points: MapPoint[];
  path?: MapPoint[];
  mini?: boolean;
  heatmap?: boolean;
};

const styleUrl = "https://tiles.openfreemap.org/styles/positron";

export function YearMap({ points, path, mini = false, heatmap = false }: YearMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: points[0] ? [points[0].lng, points[0].lat] : [0, 20],
      zoom: points.length > 0 ? (mini ? 1.6 : 3) : 1.2,
      attributionControl: !mini,
      interactive: !mini,
    });

    if (!mini) {
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    }

    map.on("load", () => {
      const featureCollection: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: "FeatureCollection",
        features: points.map((point) => ({
          type: "Feature",
          properties: { label: point.label ?? "Visit" },
          geometry: { type: "Point", coordinates: [point.lng, point.lat] },
        })),
      };

      map.addSource("visits", {
        type: "geojson",
        data: featureCollection,
        cluster: !heatmap,
        clusterMaxZoom: 8,
        clusterRadius: 42,
      });

      if (heatmap) {
        map.addLayer({
          id: "visit-heat",
          type: "heatmap",
          source: "visits",
          paint: {
            "heatmap-radius": 26,
            "heatmap-opacity": 0.72,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(83,107,77,0)",
              0.35,
              "rgba(83,107,77,0.45)",
              0.7,
              "rgba(245,158,11,0.65)",
              1,
              "rgba(185,28,28,0.8)",
            ],
          },
        });
      } else {
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "visits",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#536b4d",
            "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 30],
            "circle-opacity": 0.9,
          },
        });
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "visits",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["Open Sans Regular"],
            "text-size": 12,
          },
          paint: { "text-color": "#ffffff" },
        });
        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "visits",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#17211b",
            "circle-radius": mini ? 4 : 7,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });
      }

      if (path && path.length > 1) {
        map.addSource("path", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: path.map((point) => [point.lng, point.lat]),
            },
          },
        });
        map.addLayer({
          id: "path-line",
          type: "line",
          source: "path",
          paint: {
            "line-color": "#17211b",
            "line-width": 2,
            "line-opacity": 0.6,
          },
        });
      }

      if (points.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        points.forEach((point) => bounds.extend([point.lng, point.lat]));
        map.fitBounds(bounds, { padding: mini ? 24 : 72, maxZoom: mini ? 3.5 : 9, duration: 0 });
      }
    });

    return () => map.remove();
  }, [heatmap, mini, path, points]);

  return (
    <div
      ref={containerRef}
      className={mini ? "h-48 w-full overflow-hidden rounded-2xl" : "h-[34rem] w-full overflow-hidden rounded-3xl"}
    />
  );
}
