import React, { createContext, useContext, useEffect, useState } from "react";
import { createDefaultChecks, getDefaultCheckItems, loadChecks, loadLooks, loadPlaces, loadTrips, saveChecks, saveLooks, savePlaces, saveTrips } from "../utils/storage";
import { getDeviceId, isConfigured, loadFromCloud, saveToCloud } from "../utils/supabase";
import { getVisaWarnings } from "../utils/visa";

const TripContext = createContext();

export function TripProvider({ children }) {
  const [trips, setTrips] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [checks, setChecks] = useState([]);
  const [looks, setLooks] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [synced, setSynced] = useState(false);
  const deviceIdRef = React.useRef(null);

  useEffect(() => {
    (async () => {
      // 1. Carrega dados locais primeiro (rápido)
      let t  = await loadTrips();
      let lk = await loadLooks();
      let pl = await loadPlaces();
      let c  = await loadChecks();

      // 2. Seed checks para trips sem checklist
      let dirty = false;
      for (const trip of t) {
        const hasChecks = c.some((ch) => ch.tripId === trip.id);
        if (!hasChecks) {
          const seeded = createDefaultChecks(trip.id, trip);
          getVisaWarnings(trip.destinations ?? [], trip.origin ?? 'Brasil').forEach((w, i) => {
            seeded.push({ id: `${trip.id}_visa_${i}`, tripId: trip.id, text: `Solicitar visto — ${w.message.split(':')[0]}`, cat: 'visa', done: false });
          });
          c = [...c, ...seeded];
          dirty = true;
        }
      }
      if (dirty) await saveChecks(c);

      setTrips(t);
      setChecks(c);
      setLooks(lk);
      setPlaces(pl);
      setLoaded(true);

      // 3. Sync com Supabase em background (se configurado)
      if (isConfigured) {
        const deviceId = await getDeviceId();
        deviceIdRef.current = deviceId;
        const cloud = await loadFromCloud(deviceId);
        if (cloud && cloud.trips?.length > 0) {
          // Nuvem tem dados: usa como fonte de verdade
          setTrips(cloud.trips);
          setChecks(cloud.checks ?? []);
          setLooks(cloud.looks  ?? []);
          setPlaces(cloud.places ?? []);
          await saveTrips(cloud.trips);
          await saveChecks(cloud.checks ?? []);
          await saveLooks(cloud.looks   ?? []);
          await savePlaces(cloud.places  ?? []);
        } else if (t.length > 0) {
          // Nuvem vazia mas tem dados locais: sobe para nuvem
          await saveToCloud(deviceId, { trips: t, checks: c, looks: lk, places: pl });
        }
        setSynced(true);
      }
    })();
  }, []);

  const activeTrip = trips[activeIndex] || null;

  // Dispara sync para nuvem após qualquer mudança (fire-and-forget)
  const pushToCloud = async (nextTrips, nextChecks, nextLooks, nextPlaces) => {
    if (!isConfigured || !deviceIdRef.current) return;
    await saveToCloud(deviceIdRef.current, {
      trips:  nextTrips  ?? trips,
      checks: nextChecks ?? checks,
      looks:  nextLooks  ?? looks,
      places: nextPlaces ?? places,
    });
  };
  const activeChecks = checks.filter((c) => c.tripId === activeTrip?.id);
  const activeLooks   = looks.filter((l) => l.tripId === activeTrip?.id);
  const activePlaces  = places.filter((p) => p.tripId === activeTrip?.id);

  const addTrip = async (trip) => {
    const id = Date.now().toString();
    const newTrip = { ...trip, id };
    const next = [...trips, newTrip];
    setTrips(next);
    setActiveIndex(next.length - 1);
    await saveTrips(next);

    const tripChecks = createDefaultChecks(id, trip);
    getVisaWarnings(trip.destinations ?? [], trip.origin ?? 'Brasil').forEach((w, i) => {
      tripChecks.push({ id: `${id}_visa_${i}`, tripId: id, text: `Solicitar visto — ${w.message.split(':')[0]}`, cat: 'visa', done: false });
    });
    const nextChecks = [...checks, ...tripChecks];
    setChecks(nextChecks);
    await saveChecks(nextChecks);
    pushToCloud(next, nextChecks, null, null);
  };

  const updateTrip = async (id, data) => {
    const next = trips.map((t) => (t.id === id ? { ...t, ...data } : t));
    setTrips(next);
    await saveTrips(next);
    pushToCloud(next, null, null, null);
  };

  const deleteTrip = async (id) => {
    const next = trips.filter((t) => t.id !== id);
    setTrips(next);
    setActiveIndex(Math.min(activeIndex, next.length - 1));
    await saveTrips(next);
    const nextChecks = checks.filter((c) => c.tripId !== id);
    setChecks(nextChecks);
    await saveChecks(nextChecks);
    pushToCloud(next, nextChecks, null, null);
  };

  const toggleCheck = async (checkId) => {
    const next = checks.map((c) => c.id === checkId ? { ...c, done: !c.done } : c);
    setChecks(next);
    await saveChecks(next);
    pushToCloud(null, next, null, null);
  };

  const addCheck = async (item) => {
    if (!activeTrip) return;
    const next = [...checks, { ...item, tripId: activeTrip.id, id: Date.now().toString(), done: false }];
    setChecks(next);
    await saveChecks(next);
    pushToCloud(null, next, null, null);
  };

  const deleteCheck = async (id) => {
    const next = checks.filter((c) => c.id !== id);
    setChecks(next);
    await saveChecks(next);
    pushToCloud(null, next, null, null);
  };

  const addLooks = async (newLooks) => {
    if (!activeTrip) return;
    const withTrip = newLooks.map((l) => ({ ...l, tripId: activeTrip.id }));
    const next = [...looks.filter((l) => !withTrip.some((nl) => nl.id === l.id)), ...withTrip];
    setLooks(next);
    await saveLooks(next);
    pushToCloud(null, null, next, null);
  };

  const removeLook = async (id) => {
    const next = looks.filter((l) => l.id !== id);
    setLooks(next);
    await saveLooks(next);
    pushToCloud(null, null, next, null);
  };

  const addPlaces = async (newPlaces) => {
    if (!activeTrip) return;
    const withTrip = newPlaces.map((p) => ({ ...p, tripId: activeTrip.id }));
    const next = [...places.filter((p) => !withTrip.some((np) => np.id === p.id)), ...withTrip];
    setPlaces(next);
    await savePlaces(next);
    pushToCloud(null, null, null, next);
  };

  const removePlace = async (id) => {
    const next = places.filter((p) => p.id !== id);
    setPlaces(next);
    await savePlaces(next);
    pushToCloud(null, null, null, next);
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
        activeIndex,
        setActiveIndex,
        addTrip,
        updateTrip,
        deleteTrip,
        checks,
        activeChecks,
        toggleCheck,
        addCheck,
        deleteCheck,
        looks,
        activeLooks,
        addLooks,
        removeLook,
        places,
        activePlaces,
        addPlaces,
        removePlace,
        loaded,
        synced,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export const useTrips = () => useContext(TripContext);
