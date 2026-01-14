import { Path, Svg } from "react-native-svg";

interface CloseIconProps {
  width?: number;
  height?: number;
}

export const CloseIcon = ({ width = 20, height = 20 }: CloseIconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke="#a7f3d0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)