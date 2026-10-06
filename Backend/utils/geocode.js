// utils/geocode.js
export const geocodeLocation = async (place) => {
  if (!place) return null;
  return {
    formatted: String(place),
  };
};

export const reverseGeocode = async () => {
  return "Unknown Address";
};
