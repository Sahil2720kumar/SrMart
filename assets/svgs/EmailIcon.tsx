import { Path, Svg } from "react-native-svg";

interface EmailIconProps {
  width?: number;
  height?: number;
}

export const EmailIcon = ({ width = 20, height = 20 }: EmailIconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke="#4ade80"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M22 6l-10 7L2 6" stroke="#4ade80" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
) 