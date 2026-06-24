/**
 * HotelCard.tsx
 *
 * Card de hotel com foto real e avaliação do Google Places.
 */

import { Ionicons } from "@expo/vector-icons";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import {
    ActivityIndicator,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors, getDestImage, radius, shadow, spacing } from "../theme";
import {
    clearHotelCache,
    fetchHotelDetails,
    HotelDetails,
    priceLevelLabel,
} from "../utils/hotelDataService";

// Limpa cache na primeira montagem do app (garante refresh após troca de chave)
let _cacheClearedOnce = false;

interface HotelCardProps {
  hotelName: string;
  city: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  confirmationCode?: string;
  onEdit?: () => void;
}

export default function HotelCard({
  hotelName,
  city,
  checkIn,
  checkOut,
  confirmationCode,
  onEdit,
}: HotelCardProps) {
  const [details, setDetails] = useState<HotelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setPhotoFailed(false);
      setLoading(true);
      if (!_cacheClearedOnce) {
        _cacheClearedOnce = true;
        await clearHotelCache();
      }
      const data = await fetchHotelDetails(hotelName, city);
      if (active) {
        setDetails(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [hotelName, city]);

  const fmt = (d: string) => {
    try {
      return format(new Date(d + "T00:00:00"), "d 'de' MMM", { locale: ptBR });
    } catch {
      return d;
    }
  };

  const nights = (() => {
    try {
      return Math.max(
        0,
        differenceInDays(
          new Date(checkOut + "T00:00:00"),
          new Date(checkIn + "T00:00:00"),
        ),
      );
    } catch {
      return 0;
    }
  })();

  return (
    <View style={hc.card}>
      {/* ── foto do hotel ── */}
      <View style={hc.photoWrap}>
        {loading ? (
          <View style={hc.photoPlaceholder}>
            <ActivityIndicator color={colors.teal} size="small" />
          </View>
        ) : (
          <Image
            source={{
              uri:
                !photoFailed && details?.photoUrl
                  ? details.photoUrl
                  : getDestImage(city),
            }}
            style={hc.photo}
            contentFit="cover"
            transition={300}
            onError={() => setPhotoFailed(true)}
          />
        )}

        {/* badge de avaliação sobre a foto */}
        {details?.rating ? (
          <View style={hc.ratingBadge}>
            <Ionicons name="star" size={11} color="#F5A623" />
            <Text style={hc.ratingNum}>{details.rating.toFixed(1)}</Text>
            <Text style={hc.ratingCount}>
              (
              {details.totalRatings > 999
                ? `${(details.totalRatings / 1000).toFixed(1)}k`
                : details.totalRatings}
              )
            </Text>
          </View>
        ) : null}

        {/* botão editar no canto */}
        {onEdit && (
          <TouchableOpacity style={hc.editOverlay} onPress={onEdit}>
            <Ionicons name="pencil" size={13} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── info ── */}
      <View style={hc.body}>
        <View style={hc.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={hc.hotelName} numberOfLines={2}>
              {details?.name ?? hotelName}
            </Text>
            {details?.address ? (
              <Text style={hc.address} numberOfLines={1}>
                {details.address}
              </Text>
            ) : (
              <Text style={hc.address}>{city}</Text>
            )}
          </View>
          {/* preço e link maps */}
          <View style={hc.badgesCol}>
            {priceLevelLabel(details?.priceLevel ?? null) ? (
              <View style={hc.priceBadge}>
                <Text style={hc.priceText}>
                  {priceLevelLabel(details?.priceLevel ?? null)}
                </Text>
              </View>
            ) : null}
            {details?.googleMapsUrl ? (
              <TouchableOpacity
                style={hc.mapsBtn}
                onPress={() => Linking.openURL(details.googleMapsUrl)}
              >
                <Ionicons name="map-outline" size={13} color={colors.teal} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={hc.divider} />

        {/* check-in / noites / check-out */}
        <View style={hc.datesRow}>
          <View style={hc.dateBlock}>
            <Text style={hc.dateLabel}>check-in</Text>
            <Text style={hc.dateValue}>{fmt(checkIn)}</Text>
          </View>
          <View style={hc.nightsBlock}>
            <Text style={hc.nightsNum}>{nights}</Text>
            <Text style={hc.nightsLabel}>noites</Text>
          </View>
          <View style={[hc.dateBlock, { alignItems: "flex-end" }]}>
            <Text style={hc.dateLabel}>check-out</Text>
            <Text style={hc.dateValue}>{fmt(checkOut)}</Text>
          </View>
        </View>

        {/* código de confirmação */}
        {confirmationCode ? (
          <View style={hc.confRow}>
            <Ionicons
              name="document-text-outline"
              size={12}
              color={colors.muted}
            />
            <Text style={hc.confLabel}>confirmação</Text>
            <Text style={hc.confCode}>{confirmationCode}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const PHOTO_HEIGHT = 160;

const hc = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
    ...shadow.md,
  },

  // foto
  photoWrap: {
    height: PHOTO_HEIGHT,
    backgroundColor: colors.offwhite,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.offwhite,
  },
  photoFallbackText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },

  // badge de avaliação sobre a foto
  ratingBadge: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingNum: { fontSize: 12, fontWeight: "800", color: colors.white },
  ratingCount: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },

  // botão editar
  editOverlay: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  // body
  body: { padding: spacing.lg },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: 0,
  },
  hotelName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
    lineHeight: 20,
  },
  address: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
    marginTop: 2,
  },

  badgesCol: { alignItems: "flex-end", gap: spacing.xs },
  priceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: colors.tealLight,
    borderRadius: radius.full,
  },
  priceText: { fontSize: 11, fontWeight: "800", color: colors.teal2 },
  mapsBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  datesRow: { flexDirection: "row", alignItems: "center" },
  dateBlock: { flex: 2 },
  dateLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
    marginBottom: 2,
  },
  dateValue: { fontSize: 14, fontWeight: "800", color: colors.navy },
  nightsBlock: { flex: 1, alignItems: "center" },
  nightsNum: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.teal,
    lineHeight: 24,
  },
  nightsLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
  },

  confRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confLabel: { fontSize: 10, color: colors.muted, fontWeight: "600" },
  confCode: { fontSize: 12, fontWeight: "800", color: colors.purple },
});
