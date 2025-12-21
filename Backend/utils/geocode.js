// utils/geocode.js
import axios from "axios";

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;

/**
 * Convert a city/state/village name to { lat, lng }
 */
export const geocodeLocation = async (place) => {
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      place
    )}&apiKey=${GEOAPIFY_KEY}`;

    const res = await axios.get(url);

    if (!res.data || res.data.features.length === 0) return null;

    const loc = res.data.features[0].properties;

    return {
      lat: loc.lat,
      lng: loc.lon,
      formatted: loc.formatted
    };
  } catch (err) {
    console.error("Geoapify Geocode Error:", err.message);
    return null;
  }
};

/**
 * Convert lat,lng → readable address
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_KEY}`;

    const res = await axios.get(url);

    const props = res.data?.features?.[0]?.properties;

    return props?.formatted || "Unknown Address";
  } catch (err) {
    console.error("Geoapify Reverse Error:", err.message);
    return "Unknown Address";
  }
};
