"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";
import { STORE_LAT, STORE_LNG, distanceFromStoreKm } from "@/lib/geo";
import { Spinner } from "@/components/Spinner";

export type PickedLocation = { lat: number; lng: number; address: string };

export function LocationPicker({
  onChange,
  maxRadiusKm,
}: {
  onChange: (location: PickedLocation | null) => void;
  maxRadiusKm: number;
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [address, setAddress] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;
        const map = new google.maps.Map(mapDivRef.current, {
          center: { lat: STORE_LAT, lng: STORE_LNG },
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });
        mapRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();
        setReady(true);

        const handleIdle = () => {
          const center = map.getCenter();
          if (!center) return;
          reverseGeocode(center.lat(), center.lng());
        };
        map.addListener("idle", handleIdle);
        // Resolve the initial center immediately.
        handleIdle();
      })
      .catch((e) => setMapError(e instanceof Error ? e.message : "Could not load map."));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reverseGeocode(lat: number, lng: number) {
    setGeocoding(true);
    const km = distanceFromStoreKm(lat, lng);
    setDistanceKm(km);
    geocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
      setGeocoding(false);
      const resolvedAddress = status === "OK" && results?.[0] ? results[0].formatted_address : "";
      setAddress(resolvedAddress);
      onChange({ lat, lng, address: resolvedAddress });
    });
  }

  function useMyLocation() {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        mapRef.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  if (mapError) {
    return (
      <div className="bg-vanilla rounded-lg px-3 py-3 text-[11px] text-strawberry">
        {mapError} — please type your address below instead.
      </div>
    );
  }

  const outOfRange = distanceKm !== null && distanceKm > maxRadiusKm;

  return (
    <div>
      <div className="relative w-full h-52 rounded-lg overflow-hidden bg-vanilla">
        <div ref={mapDivRef} className="w-full h-full" />
        {/* Center-fixed pin: the map pans underneath it, pin position always == map center */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 0C7.03 0 3 4.03 3 9c0 6.5 9 15 9 15s9-8.5 9-15c0-4.97-4.03-9-9-9z"
              fill={outOfRange ? "#C0392B" : "#C8A45D"}
            />
            <circle cx="12" cy="9" r="3.2" fill="#FFF8ED" />
          </svg>
        </div>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-vanilla">
            <Spinner className="h-5 w-5 text-mocha" />
          </div>
        )}
        <button
          type="button"
          onClick={useMyLocation}
          disabled={!ready || locating}
          className="absolute bottom-2 right-2 bg-chocolate text-cream text-[10px] rounded-md px-2.5 py-1.5 flex items-center gap-1.5 disabled:opacity-60"
        >
          {locating && <Spinner className="h-3 w-3" />}
          Use my location
        </button>
      </div>

      <div className="mt-2 text-[11px] text-espresso min-h-[16px]">
        {geocoding ? (
          <span className="flex items-center gap-1.5 text-mocha">
            <Spinner className="h-3 w-3" /> Finding address...
          </span>
        ) : (
          address || "Pan the map so the pin sits on your delivery location."
        )}
      </div>

      {distanceKm !== null && (
        <div className={`text-[11px] mt-1 ${outOfRange ? "text-strawberry" : "text-mocha"}`}>
          {outOfRange
            ? `This spot is ~${distanceKm.toFixed(1)}km away — outside our ${maxRadiusKm}km delivery range.`
            : `~${distanceKm.toFixed(1)}km from the store · within delivery range`}
        </div>
      )}
    </div>
  );
}
