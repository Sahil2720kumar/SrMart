import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, Stack } from "expo-router"
import { UserIcon } from "@/assets/svgs/UserIcon"
import { EmailIcon } from "@/assets/svgs/EmailIcon"
import { PhoneIcon } from "@/assets/svgs/PhoneIcon"
import Svg, { Path } from "react-native-svg"
import Feather from "@expo/vector-icons/Feather"

// MapPin Icon Component
const MapPinIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
  </Svg>
)

export default function UpdateProfileScreen() {
  const [name, setName] = useState("Smith Mate")
  const [email, setEmail] = useState("smithmate@example.com")
  const [phone, setPhone] = useState("(205) 555-0100")
  const [address, setAddress] = useState("8502 Preston Rd. Inglewood, USA")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    phone?: string
    address?: string
  }>({})

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required"
    }

    if (!address.trim()) {
      newErrors.address = "Address is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdate = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log("Profile updated:", { name, email, phone, address })
      // router.back() or show success message
    } catch (error) {
      console.error("Update error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePhoto = () => {
    console.log("Change photo pressed")
    // Open image picker here
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: true }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View className="flex-1 px-6 pt-8 pb-8">
            <View className="flex-1 pt-6">
              {/* Profile Photo Section */}
              <View className="items-center mb-8">
                <View className="relative mb-2">
                  {/* Profile Avatar */}
                  <View className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-green-600 items-center justify-center shadow-lg">
                    <Text className="text-white text-4xl font-bold">SM</Text>
                  </View>

                  {/* Camera Button */}
                  <TouchableOpacity
                    onPress={handleChangePhoto}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full items-center justify-center shadow-lg"
                    activeOpacity={0.8}
                    style={{
                      shadowColor: "#22c55e",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Feather name="edit-3" size={16} color="white" />
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-500">Tap to change photo</Text>
              </View>

              {/* Form Fields */}
              {/* Name Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">Full Name</Text>
                <View
                  className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${errors.name ? "border-red-400" : "border-gray-300"
                    }`}
                >
                  <UserIcon />
                  <TextInput
                    className="flex-1 py-3.5 px-3 text-gray-900 text-base bg-white"
                    placeholder="Enter your name"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={(text) => {
                      setName(text)
                      if (errors.name) setErrors({ ...errors, name: undefined })
                    }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.name && (
                  <Text className="text-red-400 text-xs mt-1 ml-1">{errors.name}</Text>
                )}
              </View>

              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">Email Address</Text>
                <View
                  className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${errors.email ? "border-red-400" : "border-gray-300"
                    }`}
                >
                  <EmailIcon />
                  <TextInput
                    className="flex-1 py-3.5 px-3 text-gray-900 text-base bg-white"
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text)
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.email && (
                  <Text className="text-red-400 text-xs mt-1 ml-1">{errors.email}</Text>
                )}
              </View>

              {/* Phone Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">Mobile Number</Text>
                <View
                  className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${errors.phone ? "border-red-400" : "border-gray-300"
                    }`}
                >
                  <PhoneIcon />
                  <TextInput
                    className="flex-1 py-3.5 px-3 text-gray-900 text-base bg-white"
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9ca3af"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text)
                      if (errors.phone) setErrors({ ...errors, phone: undefined })
                    }}
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone && (
                  <Text className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</Text>
                )}
              </View>

              {/* Address Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">Address</Text>
                <View
                  className={`flex-row items-start bg-white rounded-2xl px-4 border-2 ${errors.address ? "border-red-400" : "border-gray-300"
                    }`}
                >
                  <View className="pt-3.5">
                    <MapPinIcon />
                  </View>
                  <TextInput
                    className="flex-1 py-3.5 px-3 text-gray-900 text-base bg-white"
                    placeholder="Enter your address"
                    placeholderTextColor="#9ca3af"
                    value={address}
                    onChangeText={(text) => {
                      setAddress(text)
                      if (errors.address) setErrors({ ...errors, address: undefined })
                    }}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>
                {errors.address && (
                  <Text className="text-red-400 text-xs mt-1 ml-1">{errors.address}</Text>
                )}
              </View>
            </View>


            {/* Fixed Bottom Button */}
            <View className="flex-auto py-4 w-[100%] bg-white border-t border-gray-100">
              <TouchableOpacity
                onPress={handleUpdate}
                disabled={isLoading}
                className="bg-green-500 py-4 flex-1 rounded-2xl items-center active:opacity-80 shadow-lg"
                activeOpacity={0.8}
                style={{
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-bold">Update Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}