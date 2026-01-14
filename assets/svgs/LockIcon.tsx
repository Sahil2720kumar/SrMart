import { Path, Svg } from "react-native-svg";

interface LockIconProps {
  width?: number;
  height?: number;
}

export const LockIcon = ({ width = 20, height = 20 }: LockIconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z"
      stroke="#4ade80"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke="#4ade80" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)