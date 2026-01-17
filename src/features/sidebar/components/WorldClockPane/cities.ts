export const cities = [
    { name: 'Beijing', lat: 39.9042, lng: 116.4074, timezone: 'Asia/Shanghai' },
    { name: 'New York', lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
    { name: 'London', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo' },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney' },
    { name: 'Paris', lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' },
    { name: 'Moscow', lat: 55.7558, lng: 37.6173, timezone: 'Europe/Moscow' },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai' },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198, timezone: 'Asia/Singapore' },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194, timezone: 'America/Los_Angeles' },
    { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, timezone: 'America/Sao_Paulo' },
    { name: 'Cape Town', lat: -33.9249, lng: 18.4241, timezone: 'Africa/Johannesburg' },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, timezone: 'Asia/Kolkata' },
    { name: 'Bangkok', lat: 13.7563, lng: 100.5018, timezone: 'Asia/Bangkok' },
    { name: 'Seoul', lat: 37.5665, lng: 126.9780, timezone: 'Asia/Seoul' },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, timezone: 'Asia/Hong_Kong' },
    { name: 'Berlin', lat: 52.5200, lng: 13.4050, timezone: 'Europe/Berlin' }
];

export interface City {
    name: string;
    lat: number;
    lng: number;
    timezone: string;
}
