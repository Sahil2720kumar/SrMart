import { router } from "expo-router";
import { Text } from "react-native";
import { TouchableOpacity } from "react-native";

function QuickActionButton({ icon, label, route }: { icon: React.ReactNode; label: string, route: string }) {
  
  return (
    <TouchableOpacity
      onPress={() => router.push(route)}
      className="bg-white border border-gray-200 flex-auto rounded-xl p-4 items-center gap-2 shadow-sm active:bg-gray-50"
    // style={{ width: (width - 32) / 2 - 6 }}
    >
      {icon}
      <Text className="text-xs font-medium text-center text-gray-900">{label}</Text>
    </TouchableOpacity>
  )
}


export default QuickActionButton