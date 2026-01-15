import Svg, { Circle, Path } from "react-native-svg";


export const FilterIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M4 6h16M6 12h12M8 18h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <Circle cx="8" cy="6" r="2" fill="#fff" />
    <Circle cx="16" cy="12" r="2" fill="#fff" />
    <Circle cx="10" cy="18" r="2" fill="#fff" />
  </Svg>
)