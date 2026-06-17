import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../theme";

interface CloudDividerProps {
  color?: string;
  width?: number;
}

/**
 * Fat cloud shape with uneven organic bumps.
 * Sits at the bottom of the navy hero, overlapping it slightly.
 * The path produces a chunky cloud silhouette — fewer bumps, more voluminous.
 */
export default function CloudDivider({
  color = colors.offwhite,
  width = 390,
}: CloudDividerProps) {
  const h = 72; // height of the SVG / cloud area

  // Smooth cloud path - simple and elegant
  const path = `
    M0,${h * 0.6}
    Q${390 * 0.05},${h * 0.2} ${390 * 0.15},${h * 0.15}
    Q${390 * 0.25},${h * 0.05} ${390 * 0.35},${h * 0.12}
    Q${390 * 0.5},${h * 0.0} ${390 * 0.65},${h * 0.12}
    Q${390 * 0.75},${h * 0.05} ${390 * 0.85},${h * 0.15}
    Q${390 * 0.95},${h * 0.2} ${390},${h * 0.6}
    L${390},${h}
    L0,${h}
    Z
  `;

  return (
    <View style={[styles.container, { marginTop: -2 }]}>
      <Svg
        width={width}
        height={h}
        viewBox={`0 0 390 ${h}`}
        preserveAspectRatio="none"
      >
        <Path d={path} fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 10,
  },
});
