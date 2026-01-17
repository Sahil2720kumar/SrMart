import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export const BagIcon = ({ itemCount }: { itemCount?: number }) => (
  <View>

    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
    {itemCount > 0 && (
      <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
        <Text className="text-white text-xs font-bold">{itemCount > 9 ? "9+" : itemCount}</Text>
      </View>
    )}
  </View>
)