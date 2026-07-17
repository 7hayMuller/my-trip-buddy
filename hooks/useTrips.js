import React, { createContext, useContext, useEffect, useState } from "react";
import { createDefaultChecks, getDefaultCheckItems, loadChecks, loadLooks, loadTrips, saveChecks, saveLooks, saveTrips } from "../utils/storage";
import { getDeviceId, isConfigured, loadFromCloud, saveToCloud } from "../utils/supabase";
import { getVisaWarnings } from "../utils/visa";

const TripContext = createContext();

function findNearestTrip(trips) {
  if (trips.length === 0) return null;
  const now = new Date();
  const upcoming = trips
    .filter((t) => new Date(t.ret + 'T23:59:59') >= now)
    .sort((a, b) => new Date(a.depart) - new Date(b.depart));
  return upcoming[0] ?? trips[trips.length - 1];
}

export function TripProvider({ children }) {
  const [trips, setTrips] = useState([]);
  const [checks, setChecks] = useState([]);
  const [looks, setLooks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [synced, setSynced] = useState(false);
  const deviceIdRef = React.useRef(null);

  useEffect(() => {
    (async () => {
      // 1. Carrega dados locais primeiro (rápido)
      let t  = await loadTrips();
      let lk = await loadLooks();
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
          await saveTrips(cloud.trips);
          await saveChecks(cloud.checks ?? []);
          await saveLooks(cloud.looks   ?? []);
        } else if (t.length > 0) {
          // Nuvem vazia mas tem dados locais: sobe para nuvem
          await saveToCloud(deviceId, { trips: t, checks: c, looks: lk });
        }
        setSynced(true);
      }
    })();
  }, []);

  const activeTrip = findNearestTrip(trips);

  // Dispara sync para nuvem após qualquer mudança (fire-and-forget)
  const pushToCloud = async (nextTrips, nextChecks, nextLooks) => {
    if (!isConfigured || !deviceIdRef.current) return;
    await saveToCloud(deviceIdRef.current, {
      trips:  nextTrips  ?? trips,
      checks: nextChecks ?? checks,
      looks:  nextLooks  ?? looks,
    });
  };
  const activeChecks = checks.filter((c) => c.tripId === activeTrip?.id);
  const activeLooks   = looks.filter((l) => l.tripId === activeTrip?.id);

  const addTrip = async (trip) => {
    const id = Date.now().toString();
    const newTrip = { ...trip, id };
    const next = [...trips, newTrip];
    setTrips(next);
    await saveTrips(next);

    const tripChecks = createDefaultChecks(id, trip);
    getVisaWarnings(trip.destinations ?? [], trip.origin ?? 'Brasil').forEach((w, i) => {
      tripChecks.push({ id: `${id}_visa_${i}`, tripId: id, text: `Solicitar visto — ${w.message.split(':')[0]}`, cat: 'visa', done: false });
    });
    const nextChecks = [...checks, ...tripChecks];
    setChecks(nextChecks);
    await saveChecks(nextChecks);
    pushToCloud(next, nextChecks, null);
  };

  const updateTrip = async (id, data) => {
    const next = trips.map((t) => (t.id === id ? { ...t, ...data } : t));
    setTrips(next);
    await saveTrips(next);
    pushToCloud(next, null, null);
  };

  const deleteTrip = async (id) => {
    const next = trips.filter((t) => t.id !== id);
    setTrips(next);
    await saveTrips(next);
    const nextChecks = checks.filter((c) => c.tripId !== id);
    setChecks(nextChecks);
    await saveChecks(nextChecks);
    pushToCloud(next, nextChecks, null);
  };

  const toggleCheck = async (checkId) => {
    const next = checks.map((c) => c.id === checkId ? { ...c, done: !c.done } : c);
    setChecks(next);
    await saveChecks(next);
    pushToCloud(null, next, null);
  };

  const addCheck = async (item) => {
    if (!activeTrip) return;
    const next = [...checks, { ...item, tripId: activeTrip.id, id: Date.now().toString(), done: false }];
    setChecks(next);
    await saveChecks(next);
    pushToCloud(null, next, null);
  };

  const deleteCheck = async (id) => {
    const next = checks.filter((c) => c.id !== id);
    setChecks(next);
    await saveChecks(next);
    pushToCloud(null, next, null);
  };

  const addLooks = async (newLooks) => {
    if (!activeTrip) return;
    const withTrip = newLooks.map((l) => ({ ...l, tripId: activeTrip.id }));
    const next = [...looks.filter((l) => !withTrip.some((nl) => nl.id === l.id)), ...withTrip];
    setLooks(next);
    await saveLooks(next);
    pushToCloud(null, null, next);
  };

  const removeLook = async (id) => {
    const next = looks.filter((l) => l.id !== id);
    setLooks(next);
    await saveLooks(next);
    pushToCloud(null, null, next);
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
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
        loaded,
        synced,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export const useTrips = () => useContext(TripContext);
