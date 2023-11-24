import type { APIRoute } from "astro";
import { parseGPSSeurantaInitData } from "orienteering-js/gps-seuranta";
import {
  type Map as LoggatorMap,
  type MapCalibration,
  loggatorEventSchema,
  loggatorMapSchema,
} from "orienteering-js/models";

export const get: APIRoute = async function ({ params }) {
  if (params.provider === "loggator") {
    try {
      const loggatorResponse = await fetch(
        `https://events.loggator.com/api/events/${params.eventId}`
      );

      if (!loggatorResponse.ok) {
        loggatorResponse.headers.set("Access-Control-Allow-Origin", "*");
        return loggatorResponse;
      }

      const loggatorEvent = loggatorEventSchema.parse(
        await loggatorResponse.json()
      );

      const competitors = loggatorEvent.competitors.map((c) => ({
        id: String(c.device_id),
        name: c.name,
      }));

      const mapCallibration: MapCalibration | null =
        getMapCallibrationFromLoggatorMap(loggatorEvent.map);

      return new Response(JSON.stringify({ competitors, mapCallibration }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return new Response(null, {
        status: 500,
        statusText: "Error while loading event from Loggator",
      });
    }
  }

  if (params.provider === "gps-seuranta") {
    try {
      const seurantaResponse = await fetch(
        `https://www.tulospalvelu.fi/gps/${params.eventId}/init.txt`
      );

      if (!seurantaResponse.ok) {
        seurantaResponse.headers.set("Access-Control-Allow-Origin", "*");
        return seurantaResponse;
      }

      const initRawText = await seurantaResponse.text();
      const [mapCallibration, competitors] =
        parseGPSSeurantaInitData(initRawText);

      return new Response(JSON.stringify({ competitors, mapCallibration }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return new Response(null, {
        status: 500,
        statusText: "Error while loading event from Loggator",
      });
    }
  }

  return new Response(null, {
    status: 404,
    statusText: "Not found",
  });
};

function getMapCallibrationFromLoggatorMap(
  loggatorMapOrEmptyObject: LoggatorMap | {}
): MapCalibration | null {
  const loggatorMap = loggatorMapSchema.safeParse(loggatorMapOrEmptyObject);

  if (!loggatorMap.success) return null;

  return [
    {
      gps: {
        lat: loggatorMap.data.coordinates.topLeft.lat,
        lon: loggatorMap.data.coordinates.topLeft.lng,
      },
      point: { x: 1, y: 1 },
    },
    {
      gps: {
        lat: loggatorMap.data.coordinates.bottomLeft.lat,
        lon: loggatorMap.data.coordinates.bottomLeft.lng,
      },
      point: { x: 1, y: -1 },
    },
    {
      gps: {
        lat: loggatorMap.data.coordinates.topRight.lat,
        lon: loggatorMap.data.coordinates.topRight.lng,
      },
      point: { x: -1, y: 1 },
    },
  ];
}
