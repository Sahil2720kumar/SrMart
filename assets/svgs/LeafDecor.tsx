import Svg, { Path } from "react-native-svg";

// Decorative leaf icon
interface LeafDecorProps {
  width?: number;
  height?: number;
}

export const LeafDecor = ({ width = 24, height = 24 }: LeafDecorProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"
      stroke="#22c55e"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#22c55e"
      fillOpacity={0.2}
    />
    <Path
      d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
      stroke="#22c55e"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
)