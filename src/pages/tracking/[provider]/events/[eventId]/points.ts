import type { APIRoute } from "astro";
import { parseGPSSeurantaData } from "orienteering-js/gps-seuranta";
import { loggatorPointsValidator } from "orienteering-js/models";
import { getTracksMapFromLoggatorData } from "orienteering-js/loggator";

export const get: APIRoute = async function ({ params }) {
  if (params.provider === "loggator") {
    try {
      const loggatorResponse = await fetch(
        `https://events.loggator.com/api/events/${params.eventId}/points`
      );

      if (!loggatorResponse.ok) {
        loggatorResponse.headers.set("Access-Control-Allow-Origin", "*");
        return loggatorResponse;
      }

      const pointsData = loggatorPointsValidator.parse(
        await loggatorResponse.json()
      );

      const tracks = getTracksMapFromLoggatorData(pointsData);

      return new Response(JSON.stringify(tracks), {
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
        `https://www.tulospalvelu.fi/gps/${params.eventId}/data.lst`
      );

      if (!seurantaResponse.ok) {
        seurantaResponse.headers.set("Access-Control-Allow-Origin", "*");
        return seurantaResponse;
      }

      const rawData = await seurantaResponse.text();
      const tracks = parseGPSSeurantaData(rawData);

      return new Response(JSON.stringify(tracks), {
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
