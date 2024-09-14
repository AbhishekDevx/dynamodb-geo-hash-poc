export const calculateBoundingBox = (latitude, longitude, radius) => {
    const EARTH_RADIUS = 6371; // Earth's radius in kilometers
    const latDiff = (radius / EARTH_RADIUS) * (180 / Math.PI);
    const lonDiff = (radius / (EARTH_RADIUS * Math.cos((Math.PI * latitude) / 180))) * (180 / Math.PI);

    return {
        minLat: latitude - latDiff,
        maxLat: latitude + latDiff,
        minLon: longitude - lonDiff,
        maxLon: longitude + lonDiff,
    };
};