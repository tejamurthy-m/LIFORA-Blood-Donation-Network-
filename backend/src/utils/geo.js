// Calculate great-circle distance between two points on a sphere using Haversine formula
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

// Default reference coordinates for Indian metropolitan centers
export const CITY_COORDINATES = {
  mumbai: { lat: 19.076, lng: 72.8777 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  pune: { lat: 18.5204, lng: 73.8567 },
  chennai: { lat: 13.0827, lng: 80.2707 },
};

export const AREA_COORDINATES = {
  // Bangalore / Bengaluru areas
  'basavanagudi': { lat: 12.9422, lng: 77.5753 },
  'indiranagar': { lat: 12.9784, lng: 77.6408 },
  'koramangala': { lat: 12.9352, lng: 77.6245 },
  'jayanagar': { lat: 12.9308, lng: 77.5838 },
  'whitefield': { lat: 12.9698, lng: 77.7500 },
  'hsr layout': { lat: 12.9121, lng: 77.6446 },
  'electronic city': { lat: 12.8452, lng: 77.6602 },
  'malleshwaram': { lat: 13.0031, lng: 77.5643 },
  'hebbal': { lat: 13.0358, lng: 77.5970 },
  'marathahalli': { lat: 12.9591, lng: 77.6974 },
  'rajajinagar': { lat: 12.9982, lng: 77.5530 },
  'btm layout': { lat: 12.9166, lng: 77.6101 },
  'vijayanagar': { lat: 12.9719, lng: 77.5306 },
  'vijayanagara': { lat: 12.9719, lng: 77.5306 },
  'banashankari': { lat: 12.9255, lng: 77.5468 },
  'yelahanka': { lat: 13.1007, lng: 77.5963 },
  'nagarbhavi': { lat: 12.9642, lng: 77.5111 },
  'bellandur': { lat: 12.9304, lng: 77.6784 },
  'sarjapur': { lat: 12.8600, lng: 77.7860 },
  'kengeri': { lat: 12.9177, lng: 77.4838 },
  'madiwala': { lat: 12.9226, lng: 77.6174 },
  'frazer town': { lat: 12.9968, lng: 77.6131 },
  'mg road': { lat: 12.9756, lng: 77.6066 },
  'shantinagar': { lat: 12.9569, lng: 77.5986 },

  // Mumbai areas
  'bandra': { lat: 19.0596, lng: 72.8295 },
  'bandra west': { lat: 19.0596, lng: 72.8295 },
  'bandra east': { lat: 19.0620, lng: 72.8450 },
  'andheri': { lat: 19.1136, lng: 72.8697 },
  'andheri west': { lat: 19.1363, lng: 72.8277 },
  'andheri east': { lat: 19.1155, lng: 72.8710 },
  'juhu': { lat: 19.1075, lng: 72.8263 },
  'dadar': { lat: 19.0178, lng: 72.8478 },
  'colaba': { lat: 18.9067, lng: 72.8147 },
  'powai': { lat: 19.1176, lng: 72.9060 },
  'worli': { lat: 19.0134, lng: 72.8173 },
  'borivali': { lat: 19.2307, lng: 72.8567 },
  'thane': { lat: 19.2183, lng: 72.9781 },
  'navi mumbai': { lat: 19.0330, lng: 73.0297 },

  // Delhi areas
  'connaught place': { lat: 28.6304, lng: 77.2177 },
  'saket': { lat: 28.5244, lng: 77.2066 },
  'dwarka': { lat: 28.5921, lng: 77.0460 },
  'rohini': { lat: 28.7495, lng: 77.0565 },
  'karol bagh': { lat: 28.6514, lng: 77.1907 },
  'south extension': { lat: 28.5727, lng: 77.2215 },

  // Hyderabad areas
  'banjara hills': { lat: 17.4156, lng: 78.4357 },
  'jubilee hills': { lat: 17.4319, lng: 78.4073 },
  'hitec city': { lat: 17.4435, lng: 78.3772 },
  'gachibowli': { lat: 17.4401, lng: 78.3489 },
  'secunderabad': { lat: 17.4399, lng: 78.4983 },

  // Pune areas
  'kothrud': { lat: 18.5074, lng: 73.8077 },
  'viman nagar': { lat: 18.5679, lng: 73.9143 },
  'hinjawadi': { lat: 18.5913, lng: 73.7389 },
  'hadapsar': { lat: 18.5089, lng: 73.9259 },
  'shivajinagar': { lat: 18.5314, lng: 73.8446 },

  // Chennai areas
  't nagar': { lat: 13.0418, lng: 80.2341 },
  'adyar': { lat: 13.0012, lng: 80.2565 },
  'anna nagar': { lat: 13.0850, lng: 80.2101 },
  'velachery': { lat: 12.9815, lng: 80.2180 },
  'mylapore': { lat: 13.0368, lng: 80.2676 },
};

export const resolveCoordinates = (city, area = null) => {
  if (area) {
    const areaKey = area.toLowerCase().trim();
    if (AREA_COORDINATES[areaKey]) {
      return AREA_COORDINATES[areaKey];
    }
    for (const [key, coords] of Object.entries(AREA_COORDINATES)) {
      if (areaKey.includes(key) || key.includes(areaKey)) {
        return coords;
      }
    }
  }

  if (city) {
    const cityKey = city.toLowerCase().trim();
    if (CITY_COORDINATES[cityKey]) {
      return CITY_COORDINATES[cityKey];
    }
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (cityKey.includes(key) || key.includes(cityKey)) {
        return coords;
      }
    }
  }

  return CITY_COORDINATES.mumbai;
};
