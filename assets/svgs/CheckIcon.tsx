import Svg from "react-native-svg";
import { Path } from "react-native-svg";
import { View } from "react-native"

interface CheckIconProps {
  checked: boolean;
  width?: number;
  height?: number;
}

// Check Icon
export const CheckIcon = ({ checked }: { checked: boolean }) => (
  <View
    className={`w-5 h-5 min-w-5 min-h-5 rounded items-center justify-center border border-1 border-green-500 ${checked ? "bg-green-500  " : " bg-white "
      }`}
  >

    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      {checked && (<Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />)}
    </Svg>

  </View>
)