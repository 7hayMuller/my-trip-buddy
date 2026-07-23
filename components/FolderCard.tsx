import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { dark, radius, spacing } from "../theme";

// Silhueta de pasta (aba no canto superior esquerdo + corpo), num único path
// fechado — estilo neobrutalista: contorno preto grosso, cor sólida, sombra
// dura (sem blur) desenhada como uma cópia preta do mesmo path, deslocada.
const FOLDER_PATH =
  "M6 30 L6 14 Q6 8 12 8 L42 8 L50 20 L90 20 Q96 20 96 26 L96 78 Q96 84 90 84 L12 84 Q6 84 6 78 Z";
const FOLDER_W = 100;
const FOLDER_H = 90;
const SHADOW_OFFSET = 6;

export function FolderCard({
  label,
  color,
  count,
  onPress,
}: {
  label: string;
  color: string;
  count?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={s.folderArea}>
        <View style={s.paper} />
        <Svg
          width={FOLDER_W}
          height={FOLDER_H}
          viewBox={`0 0 ${FOLDER_W} ${FOLDER_H}`}
          style={s.folderShadow}
        >
          <Path d={FOLDER_PATH} fill={dark.ink} />
        </Svg>
        <Svg width={FOLDER_W} height={FOLDER_H} viewBox={`0 0 ${FOLDER_W} ${FOLDER_H}`}>
          <Path
            d={FOLDER_PATH}
            fill={color}
            stroke={dark.ink}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        </Svg>
        {typeof count === "number" && count > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={s.label} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: {
    width: "47%",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  folderArea: {
    width: FOLDER_W + SHADOW_OFFSET,
    height: FOLDER_H + SHADOW_OFFSET + 10,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  paper: {
    position: "absolute",
    top: 2,
    width: FOLDER_W * 0.58,
    height: FOLDER_H * 0.4,
    backgroundColor: dark.white,
    borderWidth: 3,
    borderColor: dark.ink,
    borderRadius: 4,
  },
  folderShadow: {
    position: "absolute",
    top: SHADOW_OFFSET + 10,
    left: SHADOW_OFFSET,
  },
  countBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: dark.ink,
    borderRadius: radius.full,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: dark.white,
  },
  countText: { fontSize: 11, fontWeight: "900", color: dark.white },
  label: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: "900",
    color: dark.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
