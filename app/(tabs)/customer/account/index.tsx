import Feather from "@expo/vector-icons/Feather"
import { router } from "expo-router"
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native"

type MenuItem = {
  id: string
  iconName: string
  title: string
  route?: string
  iconColor?: string
}

const menuItems: MenuItem[] = [
  { id: "1", iconName: "edit-2", title: "Edit Profile", route: "edit-profile", iconColor: "#3b82f6" },
  { id: "2", iconName: "lock", title: "Change Password", route: "change-password", iconColor: "#8b5cf6" },
  // { id: "3", iconName: "credit-card", title: "Payment Method", route: "PaymentMethod", iconColor: "#f59e0b" },
  { id: "4", iconName: "package", title: "My Orders", route: "Orders", iconColor: "#10b981" },
  { id: "5", iconName: "shield", title: "Privacy Policy", route: "privacy-policy", iconColor: "#ef4444" },
  { id: "6", iconName: "file-text", title: "Terms & Conditions", route: "terms-and-conditions", iconColor: "#6366f1" },
]

export default function ProfileScreen({ navigation }: { navigation?: any }) {
  const handleLogout = () => {
    console.log("Logout pressed")
    // In your app: navigation?.navigate("Login")
  }

  const handleMenuPress = (route?: string) => {
    console.log("Navigate to:", route)
    if(route==="Orders"){
      router.navigate("/(tabs)/customer/order/orders")
      return;
    }
    // In your app: navigation?.navigate(route)
    router.navigate(`/(tabs)/customer/account/${route}`)
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header with Gradient Profile Card */}
        <View
          className="rounded-b-3xl px-6 pt-14 pb-10 mb-6"
          style={{
            backgroundColor: "#5ac268",
            shadowColor: "#22c55e",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text className="text-white text-2xl font-bold text-center mb-8">My Profile</Text>

          {/* Profile Info */}
          <View className="items-center">
            {/* Profile Image with Edit Badge */}
            <View className="relative mb-5">
              <View
                className="w-28 h-28 rounded-full items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: "#fff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                {/* Profile Image Placeholder */}
                <View className="w-full h-full bg-gradient-to-br items-center justify-center" style={{ backgroundColor: "#16a34a" }}>
                  <Text style={{ fontSize: 46, color: "#fff" }}>SM</Text>
                </View>
              </View>

              {/* Edit Badge */}
              <TouchableOpacity
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full items-center justify-center border border-white"
                style={{
                  backgroundColor: "#5ac268",
                  shadowColor: "#3b82f6",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.4,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Feather name="edit-3" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <Text className="text-white text-2xl font-bold mb-2">Smith Mate</Text>
            <View
              className="bg-white/20 px-4 py-2 rounded-full"
              style={{ backdropFilter: "blur(10px)" }}
            >
              <Text className="text-white text-sm">smithmate@example.com</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-4">
          <View
            className="bg-white rounded-3xl overflow-hidden mb-6"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleMenuPress(item.route)}
                className={`flex-row items-center px-5 py-4 ${index < menuItems.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                activeOpacity={0.6}
              >
                {/* Icon Container */}
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: `${item.iconColor}15` }}
                >
                  <Feather name={item.iconName} size={22} color={item.iconColor} />
                </View>

                {/* Title */}
                <Text className="flex-1 text-base text-gray-900 font-semibold">{item.title}</Text>

                {/* Arrow */}
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#f3f4f6" }}
                >
                  <Feather name="chevron-right" size={12} color="gray" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="rounded-2xl py-3 items-center justify-center flex-row mb-4"
            style={{
              backgroundColor: "#22c55e",
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            >
              <Feather name="log-out" size={20} color="#fff" />
            </View>
            <Text className="text-white font-bold text-lg">Logout</Text>
          </TouchableOpacity>

          {/* Version Info */}
          <Text className="text-center text-gray-400 text-sm mt-4">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  )
}