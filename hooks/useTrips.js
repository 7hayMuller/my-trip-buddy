import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  loadNotificationSettings,
  MILESTONES,
  requestNotificationPermission,
  rescheduleTripCountdown,
  saveNotificationSettings,
} from "../utils/notifications";
import { createDefaultChecks, getDefaultCheckItems, loadChecks, loadLooks, loadTrips, saveChecks, saveLooks, saveTrips } from "../utils/storage";
import { deleteCloudImages, isConfigured, loadFromCloud, saveToCloud, supabase } from "../utils/supabase";

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
  const [notifSettings, setNotifSettings] = useState(null);
  const userIdRef = React.useRef(null);
  const localReadyRef = React.useRef(null);
  // Lista mais recente de viagens — updateTrip lê daqui para que duas chamadas
  // seguidas (ex.: capa local e depois a URL do upload) não usem a mesma lista
  // antiga e a segunda desfaça a primeira.
  const tripsRef = React.useRef(trips);
  tripsRef.current = trips;

  useEffect(() => {
    loadNotificationSettings().then(setNotifSettings);
  }, []);

  useEffect(() => {
    localReadyRef.current = (async () => {
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
          c = [...c, ...seeded];
          dirty = true;
        }
      }
      if (dirty) await saveChecks(c);

      setTrips(t);
      setChecks(c);
      setLooks(lk);
      setLoaded(true);
    })();
  }, []);

  // 3. Sync com Supabase sempre que um usuário entra. Os dados na nuvem são
  // por usuário (user_data, protegido por RLS), então só dá pra sincronizar
  // com sessão ativa. Ao sair, limpa o aparelho para que o próximo usuário não
  // herde (nem suba para a conta dele) as viagens de quem saiu.
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id ?? null;
      if (event === "SIGNED_OUT") {
        userIdRef.current = null;
        setSynced(false);
        clearLocalData();
        return;
      }
      if (!userId || userId === userIdRef.current) return;
      userIdRef.current = userId;
      // Não chamar o Supabase direto dentro do callback (pode travar o client).
      setTimeout(() => syncForUser(userId), 0);
    });
    return () => subscription.unsubscribe();
  }, []);

  const syncForUser = async (userId) => {
    await localReadyRef.current;
    const t  = await loadTrips();
    const c  = await loadChecks();
    const lk = await loadLooks();
    const cloud = await loadFromCloud(userId);
    if (userIdRef.current !== userId) return;
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
      await saveToCloud(userId, { trips: t, checks: c, looks: lk });
    }
    setSynced(true);
  };

  const activeTrip = findNearestTrip(trips);

  // Reagenda as notificações de contagem regressiva sempre que a viagem
  // ativa (nome/data) ou as preferências de marco mudam — só pra viagem em
  // destaque na Home, não todas as cadastradas.
  useEffect(() => {
    if (!notifSettings) return;
    rescheduleTripCountdown(activeTrip, notifSettings);
  }, [activeTrip?.id, activeTrip?.name, activeTrip?.depart, notifSettings]);

  const persistNotifSettings = async (next) => {
    setNotifSettings(next);
    await saveNotificationSettings(next);
  };

  // Liga/desliga um marco fixo (checkbox da lista) — pede permissão de
  // notificação só quando está ligando, nunca ao desligar.
  const toggleNotifDay = async (days) => {
    const isOn = (notifSettings ?? []).includes(days);
    if (!isOn) {
      const granted = await requestNotificationPermission();
      if (!granted) return { granted: false };
    }
    const next = isOn
      ? notifSettings.filter((d) => d !== days)
      : [...(notifSettings ?? []), days];
    await persistNotifSettings(next);
    return { granted: true };
  };

  // Define o único lembrete personalizado (fora dos marcos fixos) — substitui
  // qualquer valor personalizado anterior. `days: null` remove o lembrete.
  const setCustomNotifDay = async (days) => {
    const withoutCustom = (notifSettings ?? []).filter((d) =>
      MILESTONES.includes(d),
    );
    if (days != null) {
      const granted = await requestNotificationPermission();
      if (!granted) return { granted: false };
    }
    const next = days != null ? [...withoutCustom, days] : withoutCustom;
    await persistNotifSettings(next);
    return { granted: true };
  };

  // Dispara sync para nuvem após qualquer mudança (fire-and-forget)
  const pushToCloud = async (nextTrips, nextChecks, nextLooks) => {
    if (!isConfigured || !userIdRef.current) return;
    await saveToCloud(userIdRef.current, {
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
    const nextChecks = [...checks, ...tripChecks];
    setChecks(nextChecks);
    await saveChecks(nextChecks);
    pushToCloud(next, nextChecks, null);
  };

  const updateTrip = async (id, data) => {
    const next = tripsRef.current.map((t) => (t.id === id ? { ...t, ...data } : t));
    tripsRef.current = next;
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

  // Limpa tudo que está no aparelho: armazenamento local, notificações
  // agendadas e o estado em memória.
  const clearLocalData = async () => {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith("@wanderlust")));
    await Notifications.cancelAllScheduledNotificationsAsync();
    setTrips([]);
    setChecks([]);
    setLooks([]);
    setNotifSettings(await loadNotificationSettings());
  };

  // Exclusão de conta: apaga as imagens na nuvem (precisa da sessão ainda
  // ativa) e o aparelho. A linha em user_data sai junto com o usuário, pelo
  // on delete cascade.
  const clearAllData = async () => {
    if (userIdRef.current) await deleteCloudImages(userIdRef.current);
    await clearLocalData();
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
        notifSettings,
        toggleNotifDay,
        setCustomNotifDay,
        loaded,
        synced,
        clearAllData,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export const useTrips = () => useContext(TripContext);
