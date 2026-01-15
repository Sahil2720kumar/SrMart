import { Path, Svg } from "react-native-svg";

interface BackIconProps {
  width?: number;
  height?: number;
  color?:string
  strokeWidth?:number
}

export const BackIcon = ({ width = 20, height = 20,color="#a7f3d0",strokeWidth=4 }: BackIconProps)=> (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={"#a7f3d0"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)