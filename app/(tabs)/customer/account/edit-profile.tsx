import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, Stack } from "expo-router"
import { UserIcon } from "@/assets/svgs/UserIcon"
import { EmailIcon } from "@/assets/svgs/EmailIcon"
import { PhoneIcon } from "@/assets/svgs/PhoneIcon"
import Svg, { Path } from "react-native-svg"
import Feather from "@expo/vector-icons/Feather"
import * as ImagePicker from 'expo-image-picker'
import { 
  useCustomerProfile, 
  useUpdateCustomerProfile, 
  useUploadProfileImage 
} from "@/hooks/queries"
import { useAuthStore } from "@/store/authStore"
import Toast from "react-native-toast-message"

// Calendar Icon Component
const CalendarIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
    <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
  </Svg>
)

export default function UpdateProfileScreen() {
  const session = useAuthStore((state) => state.session)
  const { data: customerProfile, isLoading: profileLoading } = useCustomerProfile()
  const updateProfile = useUpdateCustomerProfile()
  const uploadImage = useUploadProfileImage()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("")
  const [localImageUri, setLocalImageUri] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    firstName?: string
    lastName?: string
    phone?: string
    dateOfBirth?: string
  }>({})

  // Load profile data when available
  useEffect(() => {
    if (customerProfile) {
      setFirstName(customerProfile.first_name || "")
      setLastName(customerProfile.last_name || "")
      setPhone(customerProfile.phone || "")
      setDateOfBirth(customerProfile.date_of_birth || "")
      setGender(customerProfile.gender || "")
    }
  }, [customerProfile])

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }

    const validatePhone = (phone: string) => {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
      return phoneRegex.test(phone.replace(/\s/g, ""))
    }

    if (!phone.trim() || !validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number"
    }

    // Validate date format if provided (YYYY-MM-DD)
    if (dateOfBirth && !/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateOfBirth)) {
      newErrors.dateOfBirth = "Date format should be YYYY-MM-DD"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdate = async () => {
    if (!validateForm()) return

    try {
      // Upload image first if a new one was selected
      if (localImageUri) {
        await uploadImage.mutateAsync(localImageUri)
      }

      // Then update the rest of the profile
      await updateProfile.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        updated_at: new Date().toISOString(),
      })
      
      Toast.show({
        type: "success",
        text1: "Profile updated successfully",
        position: "top",
      });
      router.back()
    } catch (error) {
      console.error("Update error:", error)
      Toast.show({
        type: "error",
        text1: "Failed to update profile. Please try again.",
        position: "top",
      });
    }
  }

  const handleChangePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (status !== 'granted') {
        Toast.show({
          type: "error",
          text1: "Permission Required",
          text2: "Please allow access to your photo library to change your profile picture.",
          position: "top",
        })
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]?.uri) {
        // Set local image to display immediately
        setLocalImageUri(result.assets[0].uri)
      }
    } catch (error: any) {
      console.error("Photo selection error:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to select photo. Please try again.",
        position: "top",
      })
    }
  }

  // Get initials for fallback avatar
  const getInitials = () => {
    const first = firstName?.[0] || customerProfile?.first_name?.[0] || ""
    const last = lastName?.[0] || customerProfile?.last_name?.[0] || ""
    return (first + last).toUpperCase() || "SM"
  }

  // Get current profile image to display
  const getCurrentImageUri = () => {
    if (localImageUri) return localImageUri
    if (customerProfile?.profile_image) return customerProfile.profile_image
    return null
  }

  const isLoading = updateProfile.isPending || uploadImage.isPending

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: true }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false} 
          bounces={false}
        >
          <View className="flex-1 px-6 pt-8 pb-8">
            {profileLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
              </View>
            ) : (
              <View className="flex-1 pt-6">
                {/* Profile Photo Section */}
                <View className="items-center mb-8">
                  <View className="relative mb-2">
                    {/* Profile Avatar */}
                    <View className="w-28 h-28 rounded-full overflow-hidden shadow-lg">
                      {getCurrentImageUri() ? (
                        <Image 
                          source={{ uri: getCurrentImageUri()! }} 
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 items-center justify-center">
                          <Text className="text-white text-4xl font-bold">{getInitials()}</Text>
                        </View>
                      )}
                    </View>

                    {/* Camera Button */}
                    <TouchableOpacity
                      onPress={handleChangePhoto}
                      disabled={uploadImage.isPending}
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
                      {uploadImage.isPending ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Feather name="camera" size={16} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text className="text-sm text-gray-500">
                    {localImageUri ? "New photo selected" : "Tap to change photo"}
                  </Text>
                </View>

                {/* Form Fields */}
                {/* First Name Input */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">First Name</Text>
                  <View
                    className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${
                      errors.firstName ? "border-red-400" : "border-gray-300"
                    }`}
                  >
                    <UserIcon />
                    <TextInput
                      className="flex-1 py-3.5 px-3 text-gray-900 text-base bg-white"
                      placeholder="Enter your first name"
                      placeholderTextColor="#9ca3af"
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text)
                        if (errors.firstName) setErrors({ ...errors, firstName: undefined })
                      }}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.firstName && (
                    <Text className="text-red-400 text-xs mt-1 ml-1">{errors.firstName}</Text>
                  )}
                </View>

                {/* Last Name Input */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">Last Name</Text>
                  <View
                    className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${
                      errors.lastName ? "border-red-400" : "border-gray-300"
                    }`}
                  >
                    <UserIcon />
                    <TextInput
                      className="flex-1 py-3.5 px-3 text-gray-900 text-base bg-white"
                      placeholder="Enter your last name"
                      placeholderTextColor="#9ca3af"
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text)
                        if (errors.lastName) setErrors({ ...errors, lastName: undefined })
                      }}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.lastName && (
                    <Text className="text-red-400 text-xs mt-1 ml-1">{errors.lastName}</Text>
                  )}
                </View>

                {/* Email Input (Read-only) */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">Email Address</Text>
                  <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 border-2 border-gray-300">
                    <EmailIcon />
                    <TextInput
                      className="flex-1 py-3.5 px-3 text-gray-500 text-base bg-gray-100"
                      value={session?.user?.email || ""}
                      editable={false}
                    />
                  </View>
                  <Text className="text-gray-400 text-xs mt-1 ml-1">Email cannot be changed</Text>
                </View>

                {/* Phone Input */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">Mobile Number</Text>
                  <View
                    className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${
                      errors.phone ? "border-red-400" : "border-gray-300"
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

                {/* Date of Birth Input */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">Date of Birth</Text>
                  <View
                    className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${
                      errors.dateOfBirth ? "border-red-400" : "border-gray-300"
                    }`}
                  >
                    <CalendarIcon />
                    <TextInput
                      className="flex-1 py-3.5 px-3 text-gray-900 text-base bg-white"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9ca3af"
                      value={dateOfBirth}
                      onChangeText={(text) => {
                        setDateOfBirth(text)
                        if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: undefined })
                      }}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  {errors.dateOfBirth ? (
                    <Text className="text-red-400 text-xs mt-1 ml-1">{errors.dateOfBirth}</Text>
                  ) : (
                    <Text className="text-gray-400 text-xs mt-1 ml-1">Format: YYYY-MM-DD (e.g., 1990-01-15)</Text>
                  )}
                </View>

                {/* Gender Selection */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">Gender</Text>
                  <View className="flex-row space-x-3">
                    {/* Male */}
                    <TouchableOpacity
                      onPress={() => setGender("male")}
                      className={`flex-1 flex-row items-center justify-center py-3.5 px-4 rounded-2xl border-2 ${
                        gender === "male" 
                          ? "bg-green-50 border-green-500" 
                          : "bg-white border-gray-300"
                      }`}
                      activeOpacity={0.7}
                    >
                      <Feather 
                        name="user" 
                        size={18} 
                        color={gender === "male" ? "#22c55e" : "#6b7280"} 
                      />
                      <Text 
                        className={`ml-2 font-semibold ${
                          gender === "male" ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>

                    {/* Female */}
                    <TouchableOpacity
                      onPress={() => setGender("female")}
                      className={`flex-1 flex-row items-center justify-center py-3.5 px-4 rounded-2xl border-2 ${
                        gender === "female" 
                          ? "bg-green-50 border-green-500" 
                          : "bg-white border-gray-300"
                      }`}
                      activeOpacity={0.7}
                    >
                      <Feather 
                        name="user" 
                        size={18} 
                        color={gender === "female" ? "#22c55e" : "#6b7280"} 
                      />
                      <Text 
                        className={`ml-2 font-semibold ${
                          gender === "female" ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>

                    {/* Other */}
                    <TouchableOpacity
                      onPress={() => setGender("other")}
                      className={`flex-1 flex-row items-center justify-center py-3.5 px-4 rounded-2xl border-2 ${
                        gender === "other" 
                          ? "bg-green-50 border-green-500" 
                          : "bg-white border-gray-300"
                      }`}
                      activeOpacity={0.7}
                    >
                      <Feather 
                        name="users" 
                        size={18} 
                        color={gender === "other" ? "#22c55e" : "#6b7280"} 
                      />
                      <Text 
                        className={`ml-2 font-semibold ${
                          gender === "other" ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        Other
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Fixed Bottom Button */}
            <View className="flex-auto py-4 w-[100%] bg-white border-t border-gray-100">
              <TouchableOpacity
                onPress={handleUpdate}
                disabled={isLoading || profileLoading}
                className="bg-green-500 py-4 flex-1 rounded-2xl items-center active:opacity-80 shadow-lg"
                activeOpacity={0.8}
                style={{
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                  opacity: isLoading || profileLoading ? 0.6 : 1,
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