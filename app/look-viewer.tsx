import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrips } from "../hooks/useTrips";
import { dark, radius, shadow, spacing } from "../theme";
import { LookPin } from "../types";
import { UNASSIGNED_DAY_KEY } from "../utils/dates";
import { OUTROS_COUNTRY } from "../utils/looks";

export default function LookViewerScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { country: countryParam, day: dayParam } = useLocalSearchParams<{
    country?: string;
    day?: string;
  }>();
  const country = countryParam || OUTROS_COUNTRY;
  const day = dayParam ?? UNASSIGNED_DAY_KEY;
  const { activeLooks } = useTrips();
  const { t } = useTranslation("lookViewer");

  const looks = useMemo(
    () =>
      activeLooks.filter((l: LookPin) => {
        if ((l.country ?? OUTROS_COUNTRY) !== country) return false;
        return day === UNASSIGNED_DAY_KEY ? !l.date : l.date === day;
      }),
    [activeLooks, country, day],
  );

  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const addMore = () =>
    nav.push({ pathname: "/pinterest-picker", params: { country, day } });

  return (
    <View style={s.root}>
      <FlatList
        ref={listRef}
        data={looks}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width, height: "100%" }}>
            <Image
              source={{ uri: item.imageUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="contain"
            />
          </View>
        )}
      />

      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => nav.back()} hitSlop={8} style={s.iconBtn}>
          <Ionicons name="close" size={22} color={dark.white} />
        </TouchableOpacity>

        {looks.length > 1 && (
          <View style={s.progressRow}>
            {looks.map((look: LookPin, i: number) => (
              <View
                key={look.id}
                style={[s.progressSeg, i === index && s.progressSegActive]}
              />
            ))}
          </View>
        )}

        <View style={s.iconBtn} />
      </View>

      <TouchableOpacity
        style={[s.addBtn, { bottom: insets.bottom + spacing.lg }]}
        onPress={addMore}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={18} color={dark.ink} />
        <Text style={s.addBtnText}>{t("addMore")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: dark.ink },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressRow: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  progressSeg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressSegActive: {
    backgroundColor: dark.white,
  },

  addBtn: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: dark.yellow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    ...shadow.md,
  },
  addBtnText: { fontSize: 13, fontWeight: "800", color: dark.ink },
});
