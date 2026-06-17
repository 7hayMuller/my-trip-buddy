import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useTrips } from "../../hooks/useTrips";
import { colors, radius, shadow, spacing } from "../../theme";
import { FlightEntry, HotelEntry, Trip } from "../../types";
import { getDefaultCheckItems } from "../../utils/storage";
import { getVisaWarnings, VisaWarning } from "../../utils/visa";

// ─── step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { title: "nova viagem", subtitle: "Sobre a viagem e datas" },
  { title: "voos e hotéis", subtitle: "Suas reservas por destino" },
  { title: "revisão", subtitle: "Confirme os dados" },
] as const;

// ─── date mask: auto-inserts dashes → AAAA-MM-DD ──────────────────────────────

function maskDate(val: string): string {
  const d = val.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

// ─── tiny components ──────────────────────────────────────────────────────────

function StepDots({ current }: { current: number }) {
  return (
    <View style={s.dotsRow}>
      {STEPS.map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i + 1 < current && s.dotDone,
            i + 1 === current && s.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

// Animated progress indicator
const ProgressBar = ({ step, total }: { step: number; total: number }) => {
  const progress = (step / total) * 100;
  return (
    <View style={s.progressContainer}>
      <LinearGradient
        colors={[colors.sage, colors.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[s.progressBar, { width: `${progress}%` }]}
      />
    </View>
  );
}

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
      <Ionicons name="information-circle-outline" size={15} color={colors.teal2} />
      <Text style={s.tipText}>{text}</Text>
    </View>
  );
}

function DestChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View style={s.destChip}>
      <Ionicons name="location" size={10} color={colors.white} />
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
  return (
    <View style={s.navRow}>
      {step > 1 && (
        <TouchableOpacity style={s.navBack} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={16} color={colors.navy} />
          <Text style={s.navBackText}>voltar</Text>
        </TouchableOpacity>
      )}
      <LinearGradient
        colors={step === total ? [colors.blush, colors.accent] : [colors.sage, colors.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.navNextGrad]}
      >
        <TouchableOpacity
          style={s.navNext}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <Text style={s.navNextText}>{nextLabel}</Text>
          <Ionicons name={nextIcon} size={16} color={colors.white} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

function CloudTop() {
  return (
    <Svg
      width="100%"
      height={52}
      viewBox="0 0 390 52"
      preserveAspectRatio="none"
      style={{ marginTop: -1 }}
    >
      <Path
        d="M0,52 L0,30 Q14,30 18,18 Q22,6 36,8 Q46,10 48,26 Q56,8 76,6 Q98,4 100,22 Q108,8 130,6 Q152,4 154,22 Q162,8 184,8 Q204,8 206,22 Q216,8 238,8 Q256,8 258,20 Q268,8 288,8 Q308,10 310,24 Q316,12 330,14 Q344,16 344,28 L390,28 L390,52 Z"
        fill={colors.offwhite}
      />
    </Svg>
  );
}

const CAT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  doc:  { bg: colors.greenLight,   text: colors.green,   label: "docs"  },
  fly:  { bg: colors.purpleLight,  text: colors.purple,  label: "voo"   },
  stay: { bg: colors.goldLight,    text: colors.gold,    label: "hotel" },
  look: { bg: colors.accentLight,  text: colors.accent,  label: "looks" },
  misc: { bg: colors.offwhite,     text: colors.muted,   label: "outro" },
  visa: { bg: colors.warningLight, text: colors.warning, label: "visto" },
};

// ─── main screen ──────────────────────────────────────────────────────────────

export default function AddTripScreen() {
  const nav = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const insets = useSafeAreaInsets();
  const { addTrip, updateTrip, deleteTrip, trips } = useTrips();

  const isEdit = !!tripId;
  const existing = isEdit ? trips.find((t: any) => t.id === tripId) : null;
  const initialDests: string[] = existing?.destinations ?? [];

  const [step, setStep] = useState(1);

  // step 1
  const [name, setName] = useState(existing?.name ?? "");
  const [dests, setDests] = useState<string[]>(initialDests);
  const [destIn, setDestIn] = useState("");
  const [depart, setDepart] = useState(existing?.depart ?? "");
  const [ret, setRet] = useState(existing?.ret ?? "");
  const [origin, setOrigin] = useState(existing?.origin ?? "Brasil");

  // step 2 — multiple flights
  const [flights, setFlights] = useState<FlightEntry[]>(() => {
    if (existing?.flights?.length) return existing.flights;
    if (existing?.flightNumber)
      return [{ flightNumber: String(existing.flightNumber), dest: initialDests[0] ?? "" }];
    return [{ flightNumber: "", dest: initialDests[0] ?? "" }];
  });

  // step 2 — multiple hotels
  const [hotels, setHotels] = useState<HotelEntry[]>(() => {
    if (existing?.hotels?.length) return existing.hotels;
    if (existing?.hotelName)
      return [{ name: existing.hotelName, conf: existing.hotelConf ?? "", dest: initialDests[0] ?? "" }];
    return [{ name: "", conf: "", dest: initialDests[0] ?? "" }];
  });

  // ── helpers ────────────────────────────────────────────────────────────────

  const nights = (() => {
    try {
      return Math.max(
        0,
        differenceInDays(new Date(ret + "T00:00:00"), new Date(depart + "T00:00:00")),
      );
    } catch { return 0; }
  })();

  const fmtDate = (d: string) => {
    try { return format(new Date(d + "T00:00:00"), "d 'de' MMM", { locale: ptBR }); }
    catch { return d; }
  };

  const addDest = () => {
    const v = destIn.trim();
    if (!v) return;
    setDests((p) => [...p, v]);
    setDestIn("");
  };

  const updateFlight = (i: number, key: keyof FlightEntry, val: string) =>
    setFlights((p) => p.map((f, j) => (j === i ? { ...f, [key]: val } : f)));
  const removeFlight = (i: number) => setFlights((p) => p.filter((_, j) => j !== i));
  const addFlight = () =>
    setFlights((p) => [...p, { flightNumber: "", dest: dests[0] ?? "" }]);

  const updateHotel = (i: number, key: keyof HotelEntry, val: string) =>
    setHotels((p) => p.map((h, j) => (j === i ? { ...h, [key]: val } : h)));
  const removeHotel = (i: number) => setHotels((p) => p.filter((_, j) => j !== i));
  const addHotel = () =>
    setHotels((p) => [...p, { name: "", conf: "", dest: dests[0] ?? "" }]);

  // ── validation ─────────────────────────────────────────────────────────────

  const validateStep = (n: number): boolean => {
    if (n === 1) {
      if (!name.trim()) { Alert.alert("Ops!", "Dê um nome para a viagem."); return false; }
      if (!depart)      { Alert.alert("Ops!", "Informe a data de partida."); return false; }
    }
    if (n === 2) {
      if (!flights.some((f) => f.flightNumber.trim())) {
        Alert.alert("Ops!", "Informe pelo menos um número de voo.\nEx: JL047");
        return false;
      }
      if (!hotels.some((h) => h.name.trim())) {
        Alert.alert("Ops!", "Informe pelo menos um hotel.");
        return false;
      }
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
    const cleanFlights = flights.filter((f) => f.flightNumber.trim());
    const cleanHotels  = hotels.filter((h) => h.name.trim());
    const tripData: Omit<Trip, "id"> = {
      name: name.trim(),
      destinations: dests.length ? dests : ["Destino"],
      depart,
      ret: ret || depart,
      origin: origin.trim() || "Brasil",
      flightNumber: cleanFlights[0]?.flightNumber ?? "",
      hotelName:    cleanHotels[0]?.name ?? "",
      hotelConf:    cleanHotels[0]?.conf ?? "",
      segments: [{ from: "", fromCity: "", to: "", toCity: "" }],
      flights: cleanFlights,
      hotels:  cleanHotels,
    };
    if (isEdit && existing) {
      await updateTrip(existing.id, tripData);
    } else {
      await addTrip(tripData);
    }
    nav.back();
  };

  const handleDelete = () =>
    Alert.alert("Excluir viagem", `Excluir "${existing?.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          if (existing) { await deleteTrip(existing.id); nav.back(); }
        },
      },
    ]);

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.offwhite }}>
      {/* ── HEADER fixo (fora do KAV) ── */}
      <LinearGradient
        colors={[colors.purple, colors.blush]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.headerGrad, { paddingTop: insets.top + 8 }]}
      >
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => (step > 1 ? back() : nav.back())}
          >
            <Ionicons name="arrow-back" size={16} color={colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>{STEPS[step - 1].title}</Text>
            <Text style={s.headerSub}>{STEPS[step - 1].subtitle}</Text>
          </View>
          {isEdit && step === 1 && (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
        <ProgressBar step={step} total={3} />
      </LinearGradient>

      <CloudTop />

      {/* KAV envolve só o conteúdo scrollável — header fica fixo acima */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={s.sheet}
          contentContainerStyle={s.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ────── STEP 1: nome, destinos, datas ────── */}
          {step === 1 && (
            <>
              <SectionLabel text="sobre a viagem" />
              <View style={s.card}>
                <Label text="nome da viagem" />
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="ex: Japão setembro 2025"
                  placeholderTextColor={colors.muted}
                />

                <View style={{ height: spacing.md }} />

                <Label text="destinos" hint="adicione um por vez" />
                {dests.length > 0 && (
                  <View style={s.chipsWrap}>
                    {dests.map((d, i) => (
                      <DestChip
                        key={i}
                        label={d}
                        onRemove={() => setDests((p) => p.filter((_, j) => j !== i))}
                      />
                    ))}
                  </View>
                )}
                <View style={s.destRow}>
                  <TextInput
                    style={[s.input, { flex: 1, marginBottom: 0 }]}
                    value={destIn}
                    onChangeText={setDestIn}
                    placeholder="ex: Tóquio"
                    placeholderTextColor={colors.muted}
                    onSubmitEditing={addDest}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={s.addDestBtn} onPress={addDest}>
                    <Ionicons name="add" size={18} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>

              <SectionLabel text="passaporte / origem" />
              <View style={s.card}>
                <Label text="país do seu passaporte" hint="usado para verificar necessidade de visto" />
                <TextInput
                  style={s.input}
                  value={origin}
                  onChangeText={setOrigin}
                  placeholder="ex: Brasil"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <SectionLabel text="datas" />
              <View style={s.card}>
                <View style={s.dateRow}>
                  <View style={{ flex: 1 }}>
                    <Label text="partida" />
                    <TextInput
                      style={s.input}
                      value={depart}
                      onChangeText={(v) => setDepart(maskDate(v))}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                  </View>
                  <View style={{ width: spacing.sm }} />
                  <View style={{ flex: 1 }}>
                    <Label text="retorno" />
                    <TextInput
                      style={s.input}
                      value={ret}
                      onChangeText={(v) => setRet(maskDate(v))}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                  </View>
                </View>
                {nights > 0 && (
                  <View style={s.nightsBadge}>
                    <Ionicons name="moon-outline" size={12} color={colors.teal2} />
                    <Text style={s.nightsBadgeText}>{nights} noites</Text>
                  </View>
                )}
              </View>

              <NavButtons
                step={1}
                total={3}
                onNext={next}
                nextLabel="próximo"
                nextIcon="arrow-forward"
              />
            </>
          )}

          {/* ────── STEP 2: voos + hotéis (múltiplos) ────── */}
          {step === 2 && (
            <>
              {/* ── VOOS ── */}
              <SectionLabel text="seus voos" />

              {flights.map((f, i) => (
                <View key={i} style={s.card}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryTitle}>voo {i + 1}</Text>
                    {flights.length > 1 && (
                      <TouchableOpacity onPress={() => removeFlight(i)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={15} color={colors.accent} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {dests.length > 1 && (
                    <>
                      <Text style={s.hint}>destino deste voo</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: spacing.md }}
                      >
                        {dests.map((d, di) => (
                          <TouchableOpacity
                            key={di}
                            style={[s.destPill, f.dest === d && s.destPillActive]}
                            onPress={() => updateFlight(i, "dest", d)}
                          >
                            <Text style={[s.destPillText, f.dest === d && s.destPillTextActive]}>
                              {d}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  <Label text="número do voo" />
                  <View style={s.iconInputWrap}>
                    <Ionicons
                      name="airplane-outline"
                      size={16}
                      color={colors.muted}
                      style={s.iconInput}
                    />
                    <TextInput
                      style={[s.input, s.inputIcon]}
                      value={f.flightNumber}
                      onChangeText={(t) => updateFlight(i, "flightNumber", t.toUpperCase())}
                      placeholder="ex: JL047, G3 1234, LA8082"
                      placeholderTextColor={colors.muted}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                  <TipBox text="Encontre no e-mail de confirmação ou no app da companhia." />
                </View>
              ))}

              <TouchableOpacity style={s.addEntryBtn} onPress={addFlight}>
                <Ionicons name="add-circle-outline" size={16} color={colors.teal2} />
                <Text style={s.addEntryText}>adicionar voo</Text>
              </TouchableOpacity>

              {/* ── HOTÉIS ── */}
              <SectionLabel text="seus hotéis" />

              {hotels.map((h, i) => (
                <View key={i} style={s.card}>
                  <View style={s.entryHeader}>
                    <Text style={s.entryTitle}>hotel {i + 1}</Text>
                    {hotels.length > 1 && (
                      <TouchableOpacity onPress={() => removeHotel(i)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={15} color={colors.accent} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {dests.length > 1 && (
                    <>
                      <Text style={s.hint}>destino deste hotel</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: spacing.md }}
                      >
                        {dests.map((d, di) => (
                          <TouchableOpacity
                            key={di}
                            style={[s.destPill, h.dest === d && s.destPillActive]}
                            onPress={() => updateHotel(i, "dest", d)}
                          >
                            <Text style={[s.destPillText, h.dest === d && s.destPillTextActive]}>
                              {d}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  <Label text="nome do hotel" />
                  <View style={s.iconInputWrap}>
                    <Ionicons
                      name="business-outline"
                      size={16}
                      color={colors.muted}
                      style={s.iconInput}
                    />
                    <TextInput
                      style={[s.input, s.inputIcon]}
                      value={h.name}
                      onChangeText={(t) => updateHotel(i, "name", t)}
                      placeholder="ex: Hotel Shinjuku Granbell"
                      placeholderTextColor={colors.muted}
                    />
                  </View>

                  <View style={{ height: spacing.md }} />
                  <Label text="código de confirmação" hint="opcional" />
                  <TextInput
                    style={s.input}
                    value={h.conf}
                    onChangeText={(t) => updateHotel(i, "conf", t.toUpperCase())}
                    placeholder="ex: BK-39482910"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
              ))}

              <TouchableOpacity style={s.addEntryBtn} onPress={addHotel}>
                <Ionicons name="add-circle-outline" size={16} color={colors.teal2} />
                <Text style={s.addEntryText}>adicionar hotel</Text>
              </TouchableOpacity>

              <NavButtons
                step={2}
                total={3}
                onBack={back}
                onNext={next}
                nextLabel="revisar"
                nextIcon="arrow-forward"
              />
            </>
          )}

          {/* ────── STEP 3: revisão ────── */}
          {step === 3 && (
            <>
              <SectionLabel text="resumo da viagem" />

              <View style={s.reviewHero}>
                <Text style={s.reviewHeroName}>{name}</Text>
                <Text style={s.reviewHeroSub}>
                  {fmtDate(depart)}
                  {ret ? ` – ${fmtDate(ret)}` : ""}
                  {nights > 0 ? `  ·  ${nights} noites` : ""}
                </Text>
              </View>

              {dests.length > 0 && (
                <>
                  <SectionLabel text="destinos" />
                  <View style={s.card}>
                    <View style={s.chipsWrap}>
                      {dests.map((d, i) => (
                        <View key={i} style={s.destChipReview}>
                          <Ionicons name="location" size={10} color={colors.teal2} />
                          <Text style={s.destChipReviewText}>{d}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {flights.filter((f) => f.flightNumber.trim()).length > 0 && (
                <>
                  <SectionLabel text="voos" />
                  <View style={s.card}>
                    {flights
                      .filter((f) => f.flightNumber.trim())
                      .map((f, i, arr) => (
                        <View
                          key={i}
                          style={[s.reviewRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                        >
                          <Ionicons name="airplane-outline" size={14} color={colors.muted} />
                          <Text style={s.reviewLabel}>{f.dest || `voo ${i + 1}`}</Text>
                          <Text style={[s.reviewValue, { color: colors.teal }]}>{f.flightNumber}</Text>
                        </View>
                      ))}
                  </View>
                </>
              )}

              {hotels.filter((h) => h.name.trim()).length > 0 && (
                <>
                  <SectionLabel text="hotéis" />
                  <View style={s.card}>
                    {hotels
                      .filter((h) => h.name.trim())
                      .map((h, i, arr) => (
                        <View
                          key={i}
                          style={[s.reviewRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                        >
                          <Ionicons name="business-outline" size={14} color={colors.muted} />
                          <Text style={s.reviewLabel}>{h.dest || `hotel ${i + 1}`}</Text>
                          <Text style={s.reviewValue} numberOfLines={1}>{h.name}</Text>
                        </View>
                      ))}
                  </View>
                </>
              )}

              {(getVisaWarnings(dests, origin)).length > 0 && (
                <View style={s.visaCard}>
                  <View style={s.visaHeader}>
                    <Ionicons name="alert-circle" size={16} color={colors.warning} />
                    <Text style={s.visaTitle}>atenção: visto pode ser necessário</Text>
                  </View>
                  {getVisaWarnings(dests, origin).map((w, i) => (
                    <Text key={i} style={s.visaMsg}>• {w.message}</Text>
                  ))}
                  <Text style={s.visaTip}>
                    Itens "solicitar visto" serão adicionados ao checklist automaticamente.
                  </Text>
                </View>
              )}

              <SectionLabel text="checklist gerado automaticamente" />
              <View style={s.card}>
                {(() => {
                  const visaItems = getVisaWarnings(dests, origin);
                  const allItems = [
                    ...getDefaultCheckItems({ destinations: dests, hotels, flights }),
                    ...visaItems.map((w) => ({ cat: 'visa', text: `Solicitar visto — ${w.message.split(':')[0]}` })),
                  ];
                  return allItems.map((item, i) => {
                    const cs = CAT_STYLE[item.cat as keyof typeof CAT_STYLE] ?? CAT_STYLE.misc;
                    const isLast = i === allItems.length - 1;
                    return (
                      <View
                        key={i}
                        style={[s.checkRow, isLast && { borderBottomWidth: 0 }]}
                      >
                        <View style={s.checkCircle} />
                        <Text style={s.checkText}>{item.text}</Text>
                        <View style={[s.catPill, { backgroundColor: cs.bg }]}>
                          <Text style={[s.catPillText, { color: cs.text }]}>{cs.label}</Text>
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
                nextLabel={isEdit ? "salvar alterações" : "criar viagem"}
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
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
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
  headerTitle: { fontSize: 24, fontWeight: "900", color: colors.white, fontStyle: "italic" },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600", marginTop: 2 },

  dotsRow: { flexDirection: "row", gap: 5 },
  dot: { flex: 1, height: 3, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)" },
  dotDone:   { backgroundColor: colors.sage },
  dotActive: { backgroundColor: "rgba(255,255,255,0.6)" },

  progressContainer: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },

  sheet: { flex: 1, backgroundColor: colors.offwhite },
  sheetContent: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: 20 },

  secLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },

  label: { fontSize: 12, fontWeight: "800", color: colors.navy, marginBottom: 3 },
  hint:  { fontSize: 10, color: colors.muted, fontWeight: "600", marginBottom: 5 },

  input: {
    backgroundColor: colors.offwhite,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 13,
    fontWeight: "600",
    color: colors.navy,
  },
  iconInputWrap: { position: "relative" },
  iconInput:     { position: "absolute", left: 11, top: 12, zIndex: 1 },
  inputIcon:     { paddingLeft: 36 },

  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: colors.tealLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  tipText: { fontSize: 11, color: colors.teal2, fontWeight: "700", flex: 1, lineHeight: 16 },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: spacing.sm },
  destChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
  },
  destChipText: { fontSize: 11, fontWeight: "700", color: colors.white },
  destChipX:    { fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 16 },

  destRow:   { flexDirection: "row", gap: 8, alignItems: "center" },
  addDestBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.teal,
  },

  dateRow: { flexDirection: "row" },
  nightsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.tealLight,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
  nightsBadgeText: { fontSize: 11, fontWeight: "700", color: colors.teal2 },

  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  entryTitle: { fontSize: 12, fontWeight: "800", color: colors.navy },
  addEntryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.teal,
    backgroundColor: colors.tealLight,
    marginBottom: spacing.sm,
  },
  addEntryText: { fontSize: 12, fontWeight: "700", color: colors.teal2 },

  destPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.offwhite,
    marginRight: spacing.sm,
  },
  destPillActive:      { backgroundColor: colors.navy, borderColor: colors.navy },
  destPillText:        { fontSize: 11, fontWeight: "700", color: colors.muted },
  destPillTextActive:  { color: colors.white },

  navRow: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  navBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navBackText:  { fontSize: 13, fontWeight: "800", color: colors.navy },
  navNextGrad: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.blush,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  navNext: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
  },
  navNextText: { fontSize: 14, fontWeight: "900", color: colors.white },

  reviewHero: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  reviewHeroName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
    fontStyle: "italic",
    marginBottom: 3,
  },
  reviewHeroSub: { fontSize: 11, color: colors.muted, fontWeight: "600" },

  destChipReview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.tealLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  destChipReviewText: { fontSize: 11, fontWeight: "700", color: colors.teal2 },

  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewLabel: { fontSize: 11, color: colors.muted, fontWeight: "600", flex: 1 },
  reviewValue: { fontSize: 12, fontWeight: "800", color: colors.navy },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexShrink: 0,
  },
  checkText:   { flex: 1, fontSize: 12, fontWeight: "700", color: colors.navy },
  catPill:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  catPillText: { fontSize: 9, fontWeight: "800" },

  visaCard: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
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
  visaTitle: { fontSize: 12, fontWeight: "800", color: colors.warning, flex: 1 },
  visaMsg:   { fontSize: 11, fontWeight: "600", color: colors.warning, marginBottom: 3 },
  visaTip:   { fontSize: 10, color: colors.warning, fontWeight: "600", marginTop: spacing.xs, opacity: 0.8 },
});
