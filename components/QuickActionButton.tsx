import { Text } from "react-native";
import { TouchableOpacity } from "react-native";

function QuickActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <TouchableOpacity
      className="bg-white border border-gray-200 flex-auto rounded-xl p-4 items-center gap-2 shadow-sm active:bg-gray-50"
      // style={{ width: (width - 32) / 2 - 6 }}
    >
      {icon}
      <Text className="text-xs font-medium text-center text-gray-900">{label}</Text>
    </TouchableOpacity>
  )
}


export default QuickActionButton