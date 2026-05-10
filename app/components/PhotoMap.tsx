"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export type PhotoPoint = {
  id: number;
  lat: number;
  lng: number;
  filename: string;
  city: string | null;
  country: string | null;
  takenAt: string | null;
};

type PhotoMapProps = {
  photos: PhotoPoint[];
};

const styleUrl = "https://tiles.openfreemap.org/styles/positron";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function PhotoMap({ photos }: PhotoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || photos.length === 0) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [photos[0].lng, photos[0].lat],
      zoom: 3,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      const featureCollection: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: "FeatureCollection",
        features: photos.map((p) => ({
          type: "Feature",
          properties: {
            id: p.id,
            filename: p.filename,
            city: p.city,
            country: p.country,
            takenAt: p.takenAt,
          },
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        })),
      };

      map.addSource("photos", {
        type: "geojson",
        data: featureCollection,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      });

      map.addLayer({
        id: "photo-clusters",
        type: "circle",
        source: "photos",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#536b4d",
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 50, 32],
          "circle-opacity": 0.9,
        },
      });

      map.addLayer({
        id: "photo-cluster-count",
        type: "symbol",
        source: "photos",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Open Sans Regular"],
          "text-size": 13,
        },
        paint: { "text-color": "#ffffff" },
      });

      map.addLayer({
        id: "photo-points",
        type: "circle",
        source: "photos",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#d97706",
          "circle-radius": 8,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5,
        },
      });

      map.on("click", "photo-points", (e) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const props = feature.properties;
        const coords = feature.geometry.coordinates.slice() as [number, number];

        const location = [props.city, props.country].filter(Boolean).join(", ") || "Unknown location";
        const date = props.takenAt ? formatDate(props.takenAt) : "";

        new maplibregl.Popup({ offset: 12, maxWidth: "280px" })
          .setLngLat(coords)
          .setHTML(
            `<div style="text-align:center">` +
              `<img src="/api/photos/${props.id}" ` +
              `style="width:240px;height:auto;border-radius:8px;margin-bottom:8px" ` +
              `alt="${props.filename}" />` +
              `<div style="font-weight:600;font-size:14px">${location}</div>` +
              (date ? `<div style="color:#78716c;font-size:12px">${date}</div>` : "") +
            `</div>`,
          )
          .addTo(map);
      });

      map.on("click", "photo-clusters", (e) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const source = map.getSource("photos");
        if (source && "getClusterExpansionZoom" in source) {
          (source as maplibregl.GeoJSONSource).getClusterExpansionZoom(
            feature.properties.cluster_id as number,
          ).then((zoom) => {
            map.easeTo({
              center: feature.geometry.type === "Point"
                ? (feature.geometry.coordinates as [number, number])
                : [0, 0],
              zoom: zoom,
            });
          });
        }
      });

      map.on("mouseenter", "photo-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "photo-points", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "photo-clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "photo-clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      if (photos.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        photos.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 72, maxZoom: 9, duration: 0 });
      }
    });

    return () => map.remove();
  }, [photos]);

  if (photos.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="h-[34rem] w-full overflow-hidden rounded-2xl border border-stone-200/60 shadow-card"
    />
  );
}
