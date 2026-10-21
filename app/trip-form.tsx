import { Ionicons } from "@expo/vector-icons";
import { differenceInDays, format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import i18n from "../i18n";
import { TripDateRangePicker } from "../components/TripDateRangePicker";
import { useTrips } from "../hooks/useTrips";
import { dark, radius, shadow, spacing } from "../theme";
import { FlightEntry, HotelEntry, Trip } from "../types";
import { getTripDays } from "../utils/dates";
import { getDefaultCheckItems } from "../utils/storage";
import { getVisaWarnings } from "../utils/visa";

// ─── step config ──────────────────────────────────────────────────────────────
// Título/subtítulo de cada step vêm de i18n (namespace tripForm) — ver
// STEPS() abaixo, montada dentro do componente com o `t` já resolvido.

// ─── date mask: auto-inserts dashes → DD-MM-AAAA ──────────────────────────────
// A viagem continua guardada internamente em ISO (YYYY-MM-DD) — é o que todo
// o resto do app espera (itinerário, ordenação de viagens, checklist etc).
// Só a exibição/digitação neste formulário usa DD-MM-AAAA; a conversão
// acontece na borda (toIso ao salvar, toBr ao carregar uma viagem existente).

function maskDate(val: string): string {
  const d = val.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
}

function toIso(br: string): string {
  const m = br.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function toBr(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const [, yyyy, mm, dd] = m;
  return `${dd}-${mm}-${yyyy}`;
}

// Animated progress indicator
const ProgressBar = ({ step, total }: { step: number; total: number }) => {
  const progress = (step / total) * 100;
  return (
    <View style={s.progressContainer}>
      <View style={[s.progressBar, { width: `${progress}%` }]} />
    </View>
  );
};

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <>
      <Text style={s.label}>{text}</Text>
      {hint && <Text style={s.hint}>{hint}</Text>}
    </>
  );
}

function TipBox({ text }: { text: string }) {
  return (
    <View style={s.tip}>
      <Image
        source={require("../assets/images/icon-info.png")}
        style={{ width: 18, height: 18 }}
      />
      <Text style={s.tipText}>{text}</Text>
    </View>
  );
}

function DestChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <View style={s.destChip}>
      <Image
        source={require("../assets/images/icon-pin.png")}
        style={{ width: 16, height: 16 }}
      />
      <Text style={s.destChipText}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={8}>
        <Text style={s.destChipX}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={s.secLabel}>{text}</Text>;
}

function NavButtons({
  step,
  total,
  onBack,
  onNext,
  nextLabel,
  nextIcon,
}: {
  step: number;
  total: number;
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon: keyof typeof Ionicons.glyphMap;
}) {
  const { t } = useTranslation("tripForm");
  return (
    <View style={s.navRow}>
      {step > 1 && (
        <TouchableOpacity
          style={s.navBack}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={16} color={dark.white} />
          <Text style={s.navBackText}>{t("back")}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          s.navNext,
          {
            backgroundColor: step === total ? dark.pink : dark.blue,
            shadowColor: step === total ? dark.pink : dark.blue,
          },
        ]}
        onPress={onNext}
        activeOpacity={0.85}
      >
        <Text style={s.navNextText}>{nextLabel}</Text>
        <Ionicons name={nextIcon} size={16} color={dark.ink} />
      </TouchableOpacity>
    </View>
  );
}

// ─── destination themes ───────────────────────────────────────────────────────

type DestTheme = { grad: [string, string, string]; emoji: string };

const DEST_THEMES: Record<string, DestTheme> = {
  // Japão
  japão: { grad: ["#C878A8", "#8B5A9B", "#5B3A7B"], emoji: "🌸" },
  tóquio: { grad: ["#C878A8", "#8B5A9B", "#5B3A7B"], emoji: "🗼" },
  tokyo: { grad: ["#C878A8", "#8B5A9B", "#5B3A7B"], emoji: "🗼" },
  kyoto: { grad: ["#D4907A", "#B06850", "#8B4A38"], emoji: "⛩️" },
  osaka: { grad: ["#C878A8", "#8B5A9B", "#5B3A7B"], emoji: "🏯" },
  // Paris / França
  paris: { grad: ["#C9A030", "#A07828", "#785810"], emoji: "🗼" },
  frança: { grad: ["#3B4E9E", "#8B3A6A", "#C9A030"], emoji: "🥐" },
  // Bali / Indonésia
  bali: { grad: ["#2E8B74", "#1A6B5A", "#0A4B3A"], emoji: "🌴" },
  indonésia: { grad: ["#2E8B74", "#1A6B5A", "#0A4B3A"], emoji: "🌺" },
  // Nova York / EUA
  "nova york": { grad: ["#1A1A3E", "#2D3A6B", "#4A5B8B"], emoji: "🗽" },
  "new york": { grad: ["#1A1A3E", "#2D3A6B", "#4A5B8B"], emoji: "🗽" },
  ny: { grad: ["#1A1A3E", "#2D3A6B", "#4A5B8B"], emoji: "🗽" },
  // Dubai
  dubai: { grad: ["#C9A030", "#8B7020", "#5B4A10"], emoji: "🏙️" },
  // Bangkok / Tailândia
  bangkok: { grad: ["#9B2020", "#C04040", "#D87840"], emoji: "🏯" },
  tailândia: { grad: ["#9B2020", "#C04040", "#D87840"], emoji: "🌺" },
  // Roma / Itália
  roma: { grad: ["#C05030", "#A04028", "#784030"], emoji: "🏛️" },
  itália: { grad: ["#C05030", "#A04028", "#784030"], emoji: "🍕" },
  // Barcelona / Espanha
  barcelona: { grad: ["#C04820", "#D07030", "#E09848"], emoji: "💃" },
  espanha: { grad: ["#C04820", "#D07030", "#E09848"], emoji: "💃" },
  // Lisboa / Portugal
  lisboa: { grad: ["#1A5A8A", "#2878B8", "#48A0D8"], emoji: "🚋" },
  portugal: { grad: ["#1A5A8A", "#2878B8", "#48A0D8"], emoji: "🇵🇹" },
  // Miami
  miami: { grad: ["#C84EA0", "#8040C0", "#4060E0"], emoji: "🌊" },
  // Londres
  london: { grad: ["#8B1A1A", "#C02020", "#6B1A3A"], emoji: "🎡" },
  londres: { grad: ["#8B1A1A", "#C02020", "#6B1A3A"], emoji: "🎡" },
  // Amsterdam
  amsterdam: { grad: ["#C02060", "#E04080", "#8B2060"], emoji: "🌷" },
  // Cancún / México
  cancún: { grad: ["#0090B8", "#0070A0", "#005080"], emoji: "🏖️" },
  méxico: { grad: ["#188A32", "#C02828", "#C9A030"], emoji: "🌮" },
  // Grécia / Santorini
  grécia: { grad: ["#1870B8", "#2890D8", "#40B0F8"], emoji: "🏛️" },
  santorini: { grad: ["#1870B8", "#2890D8", "#40B0F8"], emoji: "🏛️" },
  // Maldivas
  maldivas: { grad: ["#00A8C8", "#0088A0", "#006880"], emoji: "🏝️" },
  // Marrocos
  marrocos: { grad: ["#C04820", "#D87830", "#E8A050"], emoji: "🕌" },
  // Austrália
  austrália: { grad: ["#8B4820", "#C07830", "#E8A858"], emoji: "🦘" },
  sydney: { grad: ["#1A7AAA", "#1A5A8A", "#0A3A6A"], emoji: "🦘" },
  // Default
  default: { grad: ["#8B5CF6", "#C45CF0", "#FB7185"], emoji: "✈️" },
};

function getDestTheme(destinations: string[]): DestTheme {
  const lower = destinations.join(" ").toLowerCase();
  for (const [key, theme] of Object.entries(DEST_THEMES)) {
    if (key !== "default" && lower.includes(key)) return theme;
  }
  return DEST_THEMES.default;
}

const CAT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  doc: { bg: dark.green, text: dark.ink, label: i18n.t("tripForm:catDocs") },
  fly: { bg: dark.blue, text: dark.ink, label: i18n.t("tripForm:catFlight") },
  stay: { bg: dark.yellow, text: dark.ink, label: i18n.t("tripForm:catStay") },
  look: { bg: dark.pink, text: dark.ink, label: i18n.t("tripForm:catLooks") },
  misc: { bg: "rgba(255,255,255,0.08)", text: dark.muted, label: i18n.t("tripForm:catOther") },
  visa: { bg: dark.yellow, text: dark.ink, label: i18n.t("tripForm:catVisa") },
};

function ReviewHero({
  name,
  destinations,
  depart,
  ret,
  nights,
  fmtDate,
}: {
  name: string;
  destinations: string[];
  depart: string;
  ret: string;
  nights: number;
  fmtDate: (d: string) => string;
}) {
  const { t } = useTranslation("tripForm");
  const theme = getDestTheme(destinations);
  const shimmerX = useSharedValue(-200);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(420, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <View style={s.reviewHero}>
      {/* shimmer sweep */}
      <Animated.View style={[s.heroShimmerWrap, shimmerStyle]}>
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.18)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.heroShimmer}
        />
      </Animated.View>

      {/* content */}
      <View style={{ zIndex: 3 }}>
        <Text style={s.reviewHeroName}>{name}</Text>
        <Text style={s.reviewHeroSub}>
          {fmtDate(depart)}
          {ret ? ` – ${fmtDate(ret)}` : ""}
          {nights > 0 ? `  ·  ${t("nights", { count: nights })}` : ""}
        </Text>
      </View>
    </View>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function TripFormScreen() {
  const nav = useRouter();
  const { tripId, step: stepParam } = useLocalSearchParams<{
    tripId?: string;
    step?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("tripForm");
  const { addTrip, updateTrip, deleteTrip, trips } = useTrips();

  const STEPS = [
    { title: t("stepTripTitle"), subtitle: t("stepTripSubtitle") },
    { title: t("stepFlightsHotelsTitle"), subtitle: t("stepFlightsHotelsSubtitle") },
    { title: t("stepReviewTitle"), subtitle: t("stepReviewSubtitle") },
  ] as const;

  const isEdit = !!tripId;
  const existing = isEdit ? trips.find((t: any) => t.id === tripId) : null;
  const initialDests: string[] = existing?.destinations ?? [];

  const [step, setStep] = useState(stepParam ? Number(stepParam) : 1);

  // step 1
  const [name, setName] = useState(existing?.name ?? "");
  const [dests, setDests] = useState<string[]>(initialDests);
  const [destIn, setDestIn] = useState("");
  const [depart, setDepart] = useState(
    existing?.depart ? toBr(existing.depart) : "",
  );
  const [ret, setRet] = useState(existing?.ret ? toBr(existing.ret) : "");
  const [origin, setOrigin] = useState(existing?.origin ?? "Brasil");

  // step 2 — multiple flights
  const [flights, setFlights] = useState<FlightEntry[]>(() => {
    if (existing?.flights?.length)
      return existing.flights.map((f: FlightEntry) => ({
        ...f,
        date: f.date ? toBr(f.date) : f.date,
      }));
    if (existing?.flightNumber)
      return [
        {
          flightNumber: String(existing.flightNumber),
          dest: initialDests[0] ?? "",
        },
      ];
    return [{ flightNumber: "", dest: initialDests[0] ?? "" }];
  });

  // step 2 — multiple hotels
  const [hotels, setHotels] = useState<HotelEntry[]>(() => {
    if (existing?.hotels?.length) return existing.hotels;
    if (existing?.hotelName)
      return [
        {
          name: existing.hotelName,
          conf: existing.hotelConf ?? "",
          dest: initialDests[0] ?? "",
        },
      ];
    return [{ name: "", conf: "", dest: initialDests[0] ?? "" }];
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const scrollRef = useRef<ScrollView>(null);

  // This screen lives inside a tab navigator, so it stays mounted between
  // visits — re-navigating here with a different tripId only changes the
  // route params, it doesn't remount the component. Without this effect the
  // form would keep showing whatever trip was last loaded into state.
  useEffect(() => {
    const trip = isEdit ? trips.find((t: any) => t.id === tripId) : null;
    const tripDests: string[] = trip?.destinations ?? [];

    setName(trip?.name ?? "");
    setDests(tripDests);
    setDestIn("");
    setDepart(trip?.depart ? toBr(trip.depart) : "");
    setRet(trip?.ret ? toBr(trip.ret) : "");
    setOrigin(trip?.origin ?? "Brasil");

    if (trip?.flights?.length) {
      setFlights(
        trip.flights.map((f: FlightEntry) => ({
          ...f,
          date: f.date ? toBr(f.date) : f.date,
        })),
      );
    } else if (trip?.flightNumber) {
      setFlights([
        { flightNumber: String(trip.flightNumber), dest: tripDests[0] ?? "" },
      ]);
    } else {
      setFlights([{ flightNumber: "", dest: tripDests[0] ?? "" }]);
    }

    if (trip?.hotels?.length) {
      setHotels(trip.hotels);
    } else if (trip?.hotelName) {
      setHotels([
        {
          name: trip.hotelName,
          conf: trip.hotelConf ?? "",
          dest: tripDests[0] ?? "",
        },
      ]);
    } else {
      setHotels([{ name: "", conf: "", dest: tripDests[0] ?? "" }]);
    }

    setStep(stepParam ? Number(stepParam) : 1);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, stepParam]);

  // ── helpers ────────────────────────────────────────────────────────────────

  const nights = (() => {
    try {
      return Math.max(
        0,
        differenceInDays(
          new Date(toIso(ret) + "T00:00:00"),
          new Date(toIso(depart) + "T00:00:00"),
        ),
      );
    } catch {
      return 0;
    }
  })();

  const dateLocale = i18n.language === "en" ? enUS : ptBR;
  const dayMonthPattern = i18n.language === "en" ? "MMM d" : "d 'de' MMM";

  const fmtDate = (d: string) => {
    try {
      return format(new Date(toIso(d) + "T00:00:00"), dayMonthPattern, {
        locale: dateLocale,
      });
    } catch {
      return d;
    }
  };

  const fmtIso = (iso: string) => {
    try {
      return format(new Date(iso + "T00:00:00"), "d MMM", { locale: dateLocale });
    } catch {
      return iso;
    }
  };

  const addDest = () => {
    const v = destIn.trim();
    if (!v) return;
    setDests((p) => [...p, v]);
    setDestIn("");
  };

  const updateFlight = (i: number, key: keyof FlightEntry, val: string) =>
    setFlights((p) => p.map((f, j) => (j === i ? { ...f, [key]: val } : f)));
  const removeFlight = (i: number) =>
    setFlights((p) => p.filter((_, j) => j !== i));
  const addFlight = () =>
    setFlights((p) => [...p, { flightNumber: "", dest: dests[0] ?? "" }]);

  const updateHotel = (i: number, key: keyof HotelEntry, val: string) =>
    setHotels((p) => p.map((h, j) => (j === i ? { ...h, [key]: val } : h)));
  const removeHotel = (i: number) =>
    setHotels((p) => p.filter((_, j) => j !== i));
  const addHotel = () =>
    setHotels((p) => [...p, { name: "", conf: "", dest: dests[0] ?? "" }]);
  const setHotelStay = (i: number, checkIn: string | null, checkOut: string | null) =>
    setHotels((p) =>
      p.map((h, j) =>
        j === i
          ? { ...h, checkIn: checkIn ?? undefined, checkOut: checkOut ?? undefined }
          : h,
      ),
    );

  // Dias da viagem em ISO, usados pelo seletor de período de cada hotel —
  // depart/ret aqui estão em DD-MM-AAAA (máscara de exibição do form).
  const tripDayList = getTripDays(toIso(depart), toIso(ret) || toIso(depart));

  // ── validation ─────────────────────────────────────────────────────────────

  const validateStep = (n: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (n === 1) {
      if (!name.trim()) {
        newErrors.name = t("errorTripName");
      }
      if (!depart) {
        newErrors.depart = t("errorDeparture");
      }
    }
    if (n === 2) {
      if (!flights.some((f) => f.flightNumber.trim())) {
        newErrors.flights = t("errorFlights");
      }
      if (!hotels.some((h) => h.name.trim())) {
        newErrors.hotels = t("errorHotels");
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validateStep(step)) return;
    if (step < 3) setStep((prev) => prev + 1);
    else save();
  };

  const back = () => setStep((prev) => prev - 1);

  const save = async () => {
    const isoDepart = toIso(depart);
    const isoRet = toIso(ret) || isoDepart;
    const cleanFlights = flights
      .filter((f) => f.flightNumber.trim())
      .map((f) => ({
        ...f,
        date: f.date ? toIso(f.date) || undefined : f.date,
      }));
    const cleanHotels = hotels.filter((h) => h.name.trim());
    const tripData: Omit<Trip, "id"> = {
      name: name.trim(),
      destinations: dests.length ? dests : ["Destino"],
      depart: isoDepart,
      ret: isoRet,
      origin: origin.trim() || "Brasil",
      flightNumber: cleanFlights[0]?.flightNumber ?? "",
      hotelName: cleanHotels[0]?.name ?? "",
      hotelConf: cleanHotels[0]?.conf ?? "",
      segments: [{ from: "", fromCity: "", to: "", toCity: "" }],
      flights: cleanFlights,
      hotels: cleanHotels,
    };
    if (isEdit && existing) {
      // Trocou o destino principal: a capa escolhida era do destino antigo,
      // então volta para a foto automática do novo destino.
      const destChanged = existing.destinations?.[0] !== tripData.destinations[0];
      await updateTrip(
        existing.id,
        destChanged ? { ...tripData, coverImage: undefined } : tripData,
      );
    } else {
      await addTrip(tripData);
    }
    nav.back();
  };

  const handleDelete = () =>
    Alert.alert(t("deleteTripTitle"), t("deleteTripMessage", { name: existing?.name }), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          if (existing) {
            await deleteTrip(existing.id);
            nav.back();
          }
        },
      },
    ]);

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: dark.bg }}>
      <View
        style={[
          s.headerGrad,
          {
            paddingTop: insets.top + 30,
            paddingBottom: insets.bottom,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            backgroundColor: dark.pink,
          },
        ]}
      >
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => (step > 1 ? back() : nav.back())}
          >
            <Ionicons name="arrow-back" size={16} color={dark.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>{STEPS[step - 1].title}</Text>
            <Text style={s.headerSub}>{STEPS[step - 1].subtitle}</Text>
          </View>
          {isEdit && step === 1 && (
            <TouchableOpacity onPress={handleDelete}>
              <Image
                source={require("../assets/images/icon-trash.png")}
                style={{ width: 26, height: 26 }}
              />
            </TouchableOpacity>
          )}
        </View>
        <ProgressBar step={step} total={3} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          style={s.sheet}
          contentContainerStyle={s.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <>
              <SectionLabel text={t("aboutTrip")} />
              <View style={s.card}>
                <Label text={t("tripName")} />
                <TextInput
                  style={[s.input, errors.name && { borderColor: "#E74C3C" }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("tripNamePlaceholder")}
                  placeholderTextColor={dark.muted}
                />
                {errors.name && (
                  <Text
                    style={{ fontSize: 12, color: "#E74C3C", marginTop: 6 }}
                  >
                    {errors.name}
                  </Text>
                )}

                <View style={{ height: spacing.md }} />

                <Label text={t("destinations")} hint={t("destinationsHint")} />
                {dests.length > 0 && (
                  <View style={s.chipsWrap}>
                    {dests.map((d, i) => (
                      <DestChip
                        key={i}
                        label={d}
                        onRemove={() =>
                          setDests((p) => p.filter((_, j) => j !== i))
                        }
                      />
                    ))}
                  </View>
                )}
                <View style={s.destRow}>
                  <TextInput
                    style={[s.input, { flex: 1, marginBottom: 0 }]}
                    value={destIn}
                    onChangeText={setDestIn}
                    placeholder={t("destinationPlaceholder")}
                    placeholderTextColor={dark.muted}
                    onSubmitEditing={addDest}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={s.addDestBtn} onPress={addDest}>
                    <Ionicons name="add" size={18} color={dark.ink} />
                  </TouchableOpacity>
                </View>
              </View>

              <SectionLabel text={t("passportOrigin")} />
              <View style={s.card}>
                <Label
                  text={t("passportCountry")}
                  hint={t("passportCountryHint")}
                />
                <TextInput
                  style={s.input}
                  value={origin}
                  onChangeText={setOrigin}
                  placeholder={t("originPlaceholder")}
                  placeholderTextColor={dark.muted}
                />
              </View>

              <SectionLabel text={t("dates")} />
              <View style={s.card}>
                <View style={s.dateRow}>
                  <View style={{ flex: 1 }}>
                    <Label text={t("departure")} />
                    <TextInput
                      style={[
                        s.input,
                        errors.depart && { borderColor: "#E74C3C" },
                      ]}
                      value={depart}
                      onChangeText={(v) => setDepart(maskDate(v))}
                      placeholder={t("datePlaceholder")}
                      placeholderTextColor={dark.muted}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                    {errors.depart && (
                      <Text
                        style={{ fontSize: 12, color: "#E74C3C", marginTop: 6 }}
                      >
                        {errors.depart}
                      </Text>
                    )}
                  </View>
                  <View style={{ width: spacing.sm }} />
                  <View style={{ flex: 1 }}>
                    <Label text={t("return")} />
                    <TextInput
                      style={s.input}
                      value={ret}
                      onChangeText={(v) => setRet(maskDate(v))}
                      placeholder={t("datePlaceholder")}
                      placeholderTextColor={dark.muted}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                  </View>
                </View>
                {nights > 0 && (
                  <View style={s.nightsBadge}>
                    <Image
                      source={require("../assets/images/icon-moon.png")}
                      style={{ width: 16, height: 16 }}
                    />
                    <Text style={s.nightsBadgeText}>{t("nights", { count: nights })}</Text>
                  </View>
                )}
              </View>

              <NavButtons
                step={1}
                total={3}
                onNext={next}
                nextLabel={t("next")}
                nextIcon="arrow-forward"
              />
            </>
          )}

          {step === 2 && (
            <>
              <SectionLabel text={t("yourFlights")} />

              {flights.map((f, i) => (
                <View key={i} style={s.card}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryTitle}>{t("flightEntryTitle", { index: i + 1 })}</Text>
                    {flights.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeFlight(i)}
                        hitSlop={8}
                      >
                        <Image
                          source={require("../assets/images/icon-trash.png")}
                          style={{ width: 22, height: 22 }}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {dests.length > 1 && (
                    <>
                      <Text style={s.hint}>{t("flightDestination")}</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: spacing.md }}
                      >
                        {dests.map((d, di) => (
                          <TouchableOpacity
                            key={di}
                            style={[
                              s.destPill,
                              f.dest === d && s.destPillActive,
                            ]}
                            onPress={() => updateFlight(i, "dest", d)}
                          >
                            <Text
                              style={[
                                s.destPillText,
                                f.dest === d && s.destPillTextActive,
                              ]}
                            >
                              {d}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  <Label text={t("flightNumber")} />
                  <View style={s.iconInputWrap}>
                    <Image
                      source={require("../assets/images/icon-plane.png")}
                      style={[s.iconInput, { width: 18, height: 18 }]}
                    />
                    <TextInput
                      style={[s.input, s.inputIcon]}
                      value={f.flightNumber}
                      onChangeText={(txt) =>
                        updateFlight(i, "flightNumber", txt.toUpperCase())
                      }
                      placeholder={t("flightNumberPlaceholder")}
                      placeholderTextColor={dark.muted}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                  <TipBox text={t("flightTip")} />

                  <Label
                    text={t("flightDateOptional")}
                    hint={t("flightDateHint")}
                  />
                  <TextInput
                    style={s.input}
                    value={f.date ?? ""}
                    onChangeText={(v) => updateFlight(i, "date", maskDate(v))}
                    placeholder={t("datePlaceholder")}
                    placeholderTextColor={dark.muted}
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
              ))}

              <TouchableOpacity style={s.addEntryBtn} onPress={addFlight}>
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color={dark.blue}
                />
                <Text style={s.addEntryText}>{t("addFlight")}</Text>
              </TouchableOpacity>
              {errors.flights && (
                <Text style={{ fontSize: 12, color: "#E74C3C", marginTop: 6 }}>
                  {errors.flights}
                </Text>
              )}

              <SectionLabel text={t("yourHotels")} />

              {hotels.map((h, i) => (
                <View key={i} style={s.card}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryTitle}>{t("hotelEntryTitle", { index: i + 1 })}</Text>
                    {hotels.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeHotel(i)}
                        hitSlop={8}
                      >
                        <Image
                          source={require("../assets/images/icon-trash.png")}
                          style={{ width: 22, height: 22 }}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {dests.length > 1 && (
                    <>
                      <Text style={s.hint}>{t("hotelDestination")}</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: spacing.md }}
                      >
                        {dests.map((d, di) => (
                          <TouchableOpacity
                            key={di}
                            style={[
                              s.destPill,
                              h.dest === d && s.destPillActive,
                            ]}
                            onPress={() => updateHotel(i, "dest", d)}
                          >
                            <Text
                              style={[
                                s.destPillText,
                                h.dest === d && s.destPillTextActive,
                              ]}
                            >
                              {d}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  <Label text={t("hotelName")} />
                  <View style={s.iconInputWrap}>
                    <Image
                      source={require("../assets/images/icon-building.png")}
                      style={[s.iconInput, { width: 18, height: 18 }]}
                    />
                    <TextInput
                      style={[s.input, s.inputIcon]}
                      value={h.name}
                      onChangeText={(txt) => updateHotel(i, "name", txt)}
                      placeholder={t("hotelNamePlaceholder")}
                      placeholderTextColor={dark.muted}
                    />
                  </View>

                  {tripDayList.length > 0 && (
                    <>
                      <View style={{ height: spacing.md }} />
                      <Label text={t("checkInOut")} hint={t("optional")} />
                      <TripDateRangePicker
                        days={tripDayList}
                        startKey={h.checkIn ?? null}
                        endKey={h.checkOut ?? null}
                        onChange={(start, end) => setHotelStay(i, start, end)}
                      />
                    </>
                  )}

                  <View style={{ height: spacing.md }} />
                  <Label text={t("confirmationCode")} hint={t("optional")} />
                  <TextInput
                    style={s.input}
                    value={h.conf}
                    onChangeText={(txt) =>
                      updateHotel(i, "conf", txt.toUpperCase())
                    }
                    placeholder={t("confirmationCodePlaceholder")}
                    placeholderTextColor={dark.muted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
              ))}

              <TouchableOpacity style={s.addEntryBtn} onPress={addHotel}>
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color={dark.blue}
                />
                <Text style={s.addEntryText}>{t("addHotel")}</Text>
              </TouchableOpacity>
              {errors.hotels && (
                <Text style={{ fontSize: 12, color: "#E74C3C", marginTop: 6 }}>
                  {errors.hotels}
                </Text>
              )}

              <NavButtons
                step={2}
                total={3}
                onBack={back}
                onNext={next}
                nextLabel={t("reviewStep")}
                nextIcon="arrow-forward"
              />
            </>
          )}

          {step === 3 && (
            <>
              <SectionLabel text={t("tripSummary")} />

              <ReviewHero
                name={name}
                destinations={dests}
                depart={depart}
                ret={ret}
                nights={nights}
                fmtDate={fmtDate}
              />

              {dests.length > 0 && (
                <>
                  <SectionLabel text={t("destinations")} />
                  <View style={s.card}>
                    <View style={s.chipsWrap}>
                      {dests.map((d, i) => (
                        <View key={i} style={s.destChipReview}>
                          <Image
                            source={require("../assets/images/icon-pin.png")}
                            style={{ width: 16, height: 16 }}
                          />
                          <Text style={s.destChipReviewText}>{d}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {flights.filter((f) => f.flightNumber.trim()).length > 0 && (
                <>
                  <SectionLabel text={t("flights")} />
                  <View style={s.card}>
                    {flights
                      .filter((f) => f.flightNumber.trim())
                      .map((f, i, arr) => (
                        <View
                          key={i}
                          style={[
                            s.reviewRow,
                            i === arr.length - 1 && { borderBottomWidth: 0 },
                          ]}
                        >
                          <Image
                            source={require("../assets/images/icon-plane.png")}
                            style={{ width: 16, height: 16 }}
                          />
                          <Text style={s.reviewLabel}>
                            {f.dest || t("flightEntryTitle", { index: i + 1 })}
                          </Text>
                          <Text style={[s.reviewValue, { color: dark.blue }]}>
                            {f.flightNumber}
                          </Text>
                        </View>
                      ))}
                  </View>
                </>
              )}

              {hotels.filter((h) => h.name.trim()).length > 0 && (
                <>
                  <SectionLabel text={t("hotels")} />
                  <View style={s.card}>
                    {hotels
                      .filter((h) => h.name.trim())
                      .map((h, i, arr) => (
                        <View
                          key={i}
                          style={[
                            s.reviewRow,
                            i === arr.length - 1 && { borderBottomWidth: 0 },
                          ]}
                        >
                          <Image
                            source={require("../assets/images/icon-building.png")}
                            style={{ width: 16, height: 16 }}
                          />
                          <Text style={s.reviewLabel}>
                            {h.dest || t("hotelEntryTitle", { index: i + 1 })}
                          </Text>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={s.reviewValue} numberOfLines={1}>
                              {h.name}
                            </Text>
                            {h.checkIn && h.checkOut && (
                              <Text style={s.reviewStay}>
                                {fmtIso(h.checkIn)} – {fmtIso(h.checkOut)}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                  </View>
                </>
              )}

              {getVisaWarnings(dests, origin, toIso(depart)).length > 0 && (
                <View style={s.visaCard}>
                  <View style={s.visaHeader}>
                    <Image
                      source={require("../assets/images/icon-warning.png")}
                      style={{ width: 18, height: 18 }}
                    />
                    <Text style={s.visaTitle}>{t("visaWarningTitle")}</Text>
                  </View>
                  {getVisaWarnings(dests, origin, toIso(depart)).map((w, i) => (
                    <Text key={i} style={s.visaMsg}>
                      • {w.message}
                    </Text>
                  ))}
                  <Text style={s.visaTip}>{t("visaTip")}</Text>
                </View>
              )}

              <SectionLabel text={t("generatedChecklist")} />
              <View style={s.card}>
                {(() => {
                  const visaItems = getVisaWarnings(dests, origin, toIso(depart));
                  const allItems = [
                    ...getDefaultCheckItems({
                      destinations: dests,
                      hotels,
                      flights,
                    }),
                    ...visaItems.map((w) => ({
                      cat: "visa",
                      text: `${t("visaChecklistPrefix")}${w.message.split(":")[0]}`,
                    })),
                  ];
                  return allItems.map((item, i) => {
                    const cs =
                      CAT_STYLE[item.cat as keyof typeof CAT_STYLE] ??
                      CAT_STYLE.misc;
                    const isLast = i === allItems.length - 1;
                    return (
                      <View
                        key={i}
                        style={[s.checkRow, isLast && { borderBottomWidth: 0 }]}
                      >
                        <View style={s.checkCircle} />
                        <Text style={s.checkText}>{item.text}</Text>
                        <View style={[s.catPill, { backgroundColor: cs.bg }]}>
                          <Text style={[s.catPillText, { color: cs.text }]}>
                            {cs.label}
                          </Text>
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>

              <NavButtons
                step={3}
                total={3}
                onBack={back}
                onNext={next}
                nextLabel={isEdit ? t("saveChanges") : t("createTrip")}
                nextIcon="checkmark"
              />
            </>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  headerGrad: {
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: dark.ink,
  },
  headerSub: {
    fontSize: 16,
    color: "rgba(10,10,10,0.7)",
    marginTop: 2,
    marginBottom: 6,
  },

  dotsRow: { flexDirection: "row", gap: 5 },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dotDone: { backgroundColor: dark.green },
  dotActive: { backgroundColor: "rgba(255,255,255,0.6)" },

  progressContainer: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: dark.ink,
  },

  sheet: { flex: 1, backgroundColor: dark.bg },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: 20,
  },

  secLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: dark.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: dark.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: dark.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: dark.white,
    marginBottom: 3,
  },
  hint: {
    fontSize: 10,
    color: dark.muted,
    fontWeight: "600",
    marginBottom: 5,
  },

  input: {
    backgroundColor: dark.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: dark.border,
    padding: spacing.md,
    fontSize: 13,
    fontWeight: "600",
    color: dark.white,
  },
  iconInputWrap: { position: "relative" },
  iconInput: { position: "absolute", left: 11, top: 12, zIndex: 1 },
  inputIcon: { paddingLeft: 36 },

  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "rgba(69,144,248,0.15)",
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  tipText: {
    fontSize: 11,
    color: dark.blue,
    fontWeight: "700",
    flex: 1,
    lineHeight: 16,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: spacing.sm,
  },
  destChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: "rgba(69,144,248,0.15)",
  },
  destChipText: { fontSize: 11, fontWeight: "700", color: dark.blue },
  destChipX: { fontSize: 15, color: dark.blue, lineHeight: 16 },

  destRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  addDestBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: dark.blue,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.teal,
  },

  dateRow: { flexDirection: "row" },
  nightsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(69,144,248,0.15)",
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
  nightsBadgeText: { fontSize: 11, fontWeight: "700", color: dark.blue },

  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  entryTitle: { fontSize: 12, fontWeight: "800", color: dark.white },
  addEntryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: dark.blue,
    backgroundColor: "rgba(69,144,248,0.15)",
    marginBottom: spacing.sm,
  },
  addEntryText: { fontSize: 12, fontWeight: "700", color: dark.blue },

  destPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: dark.border,
    backgroundColor: dark.surfaceAlt,
    marginRight: spacing.sm,
  },
  destPillActive: {
    backgroundColor: "rgba(69,144,248,0.15)",
    borderColor: dark.blue,
  },
  destPillText: { fontSize: 11, fontWeight: "700", color: dark.muted },
  destPillTextActive: { color: dark.blue },
  navRow: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  navBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: dark.border,
    backgroundColor: dark.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  navBackText: { fontSize: 13, fontWeight: "800", color: dark.white },
  navNext: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  navNextText: { fontSize: 14, fontWeight: "900", color: dark.ink },

  reviewHero: {
    backgroundColor: dark.blue,
    borderRadius: radius.xl,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: dark.pink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  heroCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -35,
    right: -25,
  },
  heroCircle2: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -20,
    right: 55,
  },
  heroCircle3: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: 12,
    right: 80,
  },
  heroEmoji: {
    position: "absolute",
    fontSize: 64,
    right: spacing.lg,
    bottom: -4,
    opacity: 0.35,
    zIndex: 2,
  },
  heroShimmerWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 100,
    zIndex: 1,
  },
  heroShimmer: {
    width: 100,
    flex: 1,
  },
  reviewHeroName: {
    fontSize: 22,
    fontWeight: "900",
    color: dark.white,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reviewHeroSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },

  destChipReview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: "rgba(69,144,248,0.15)",
    borderWidth: 1,
    borderColor: dark.border,
  },
  destChipReviewText: { fontSize: 11, fontWeight: "700", color: dark.blue },

  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: dark.border,
  },
  reviewLabel: {
    fontSize: 11,
    color: dark.muted,
    fontWeight: "600",
    flex: 1,
  },
  reviewValue: { fontSize: 12, fontWeight: "800", color: dark.white },
  reviewStay: { fontSize: 10, fontWeight: "600", color: dark.muted, marginTop: 2 },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: dark.border,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: dark.border,
    flexShrink: 0,
  },
  checkText: { flex: 1, fontSize: 12, fontWeight: "700", color: dark.white },
  catPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  catPillText: { fontSize: 9, fontWeight: "800" },

  visaCard: {
    backgroundColor: "rgba(236,226,46,0.12)",
    borderWidth: 1,
    borderColor: "rgba(236,226,46,0.35)",
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  visaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.sm,
  },
  visaTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: dark.yellow,
    flex: 1,
  },
  visaMsg: {
    fontSize: 11,
    fontWeight: "600",
    color: dark.yellow,
    marginBottom: 3,
  },
  visaTip: {
    fontSize: 10,
    color: dark.yellow,
    fontWeight: "600",
    marginTop: spacing.xs,
    opacity: 0.8,
  },
});
