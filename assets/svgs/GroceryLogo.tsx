import { Path, Svg } from "react-native-svg";

interface GroceryLogoProps {
  width?: number;
  height?: number;
}

export const GroceryLogo = ({ width = 36, height = 36 }: GroceryLogoProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
      stroke="#16a34a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M3 6h18" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 10a4 4 0 01-8 0" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)