import { Path, Svg } from "react-native-svg";

interface ShieldIconProps {
  width?: number;
  height?: number;
}

export const ShieldIcon =  ({ width = 20, height = 20 }: ShieldIconProps) => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke="#22c55e"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)