import Svg, { Path } from "react-native-svg"


export const LockResetIcon = () => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z"
      stroke="#22c55e"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M7 11V7a5 5 0 019.9-1" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 15v2" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)