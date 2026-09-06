interface AddressResult {
  address: string;
  country: string;
  city: string;
}

const cache = new Map<string, AddressResult>();

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "what-do-you-see (local privacy tool)";

function toResult(place: {
  display_name?: string;
  address?: Record<string, string>;
}): AddressResult {
  const a = place.address ?? {};
  return {
    address: place.display_name ?? "",
    country: a.country ?? "",
    city: a.city ?? a.town ?? a.village ?? a.county ?? "",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latParam = url.searchParams.get("lat");
  const lonParam = url.searchParams.get("lon");
  const lat = Number(latParam);
  const lon = Number(lonParam);

  if (!latParam || !lonParam || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "lat and lon query params are required" }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return Response.json({ error: "lat/lon out of range" }, { status: 400 });
  }

  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached) return Response.json(cached);

  try {
    const response = await fetch(
      `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lon}`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!response.ok) {
      return Response.json(
        { error: `Nominatim responded ${response.status}` },
        { status: 502 }
      );
    }
    const place = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    if (!place || place.display_name == null) {
      return Response.json({ error: "No location found" }, { status: 404 });
    }
    const result = toResult(place);
    cache.set(key, result);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Reverse geocoding failed: ${message}` },
      { status: 502 }
    );
  }
}
