import {
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const places = pgTable(
  "places",
  {
    id: serial("id").primaryKey(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    placeKey: varchar("place_key", { length: 64 }).notNull(),
    city: text("city"),
    region: text("region"),
    country: text("country"),
    countryCode: varchar("country_code", { length: 2 }),
    displayName: text("display_name"),
    googlePlaceId: text("google_place_id"),
  },
  (table) => ({
    placeKeyIdx: uniqueIndex("places_place_key_idx").on(table.placeKey),
    countryIdx: index("places_country_code_idx").on(table.countryCode),
  }),
);

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  primaryCountryCode: varchar("primary_country_code", { length: 2 }),
  notes: text("notes"),
});

export const visits = pgTable(
  "visits",
  {
    id: serial("id").primaryKey(),
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    arrivedAt: timestamp("arrived_at", { withTimezone: true }).notNull(),
    departedAt: timestamp("departed_at", { withTimezone: true }).notNull(),
    source: text("source").notNull().default("google-timeline"),
    tripId: integer("trip_id").references(() => trips.id, { onDelete: "set null" }),
    raw: jsonb("raw"),
  },
  (table) => ({
    arrivedIdx: index("visits_arrived_at_idx").on(table.arrivedAt),
    tripIdx: index("visits_trip_id_idx").on(table.tripId),
    placeIdx: index("visits_place_id_idx").on(table.placeId),
  }),
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const imports = pgTable("imports", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  format: text("format").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  visitCount: integer("visit_count").notNull(),
});

export const placesRelations = relations(places, ({ many }) => ({
  visits: many(visits),
}));

export const tripsRelations = relations(trips, ({ many }) => ({
  visits: many(visits),
}));

export const visitsRelations = relations(visits, ({ one }) => ({
  place: one(places, {
    fields: [visits.placeId],
    references: [places.id],
  }),
  trip: one(trips, {
    fields: [visits.tripId],
    references: [trips.id],
  }),
}));

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;
export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;
