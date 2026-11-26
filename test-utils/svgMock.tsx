/**
 * Jest stand-in for `*.svg` imports.
 *
 * Metro turns SVGs into React components via react-native-svg-transformer;
 * Jest has no such transformer, so without this mapping an SVG import resolves
 * to an asset object and rendering it throws "Element type is invalid".
 * Mapped in jest.config.js (must come before the `@/assets` alias).
 */
import React from "react";
import { View, ViewProps } from "react-native";
import type { SvgProps } from "react-native-svg";

// SvgProps (width, color, ...) pass through to the View so tests can assert on them
const SvgMock = React.forwardRef<View, SvgProps>(function SvgMock(props, ref) {
  const viewProps = props as unknown as ViewProps;
  return <View ref={ref} {...viewProps} testID={viewProps.testID ?? "svg-icon"} />;
});

export default SvgMock;
export const ReactComponent = SvgMock;
