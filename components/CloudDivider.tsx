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

  // Viewbox width kept at 390 — scales to device width via width prop
  // Path: starts bottom-left, rises to uneven bumpy top, ends bottom-right
  // Bumps are deliberately uneven: one big central dome, two medium sides, two small edges
  const path = `
    M0,${h}
    L0,${h * 0.72}
    Q${390 * 0.02},${h * 0.72} ${390 * 0.04},${h * 0.58}
    Q${390 * 0.07},${h * 0.32} ${390 * 0.13},${h * 0.34}
    Q${390 * 0.19},${h * 0.36} ${390 * 0.2},${h * 0.52}
    Q${390 * 0.22},${h * 0.28} ${390 * 0.3},${h * 0.2}
    Q${390 * 0.4},${h * 0.1} ${390 * 0.5},${h * 0.08}
    Q${390 * 0.6},${h * 0.06} ${390 * 0.68},${h * 0.16}
    Q${390 * 0.75},${h * 0.26} ${390 * 0.76},${h * 0.44}
    Q${390 * 0.79},${h * 0.22} ${390 * 0.86},${h * 0.22}
    Q${390 * 0.93},${h * 0.22} ${390 * 0.95},${h * 0.4}
    Q${390 * 0.97},${h * 0.56} ${390 * 1.0},${h * 0.6}
    L${390},${h}
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
