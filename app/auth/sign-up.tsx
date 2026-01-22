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
  Modal,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Stack } from "expo-router"
import { GroceryLogo } from "@/assets/svgs/GroceryLogo"
import { GoogleLogo } from "@/assets/svgs/GoogleLogo"
import { EmailIcon } from "@/assets/svgs/EmailIcon"
import { LockIcon } from "@/assets/svgs/LockIcon"
import { UserIcon } from "@/assets/svgs/UserIcon"
import { CheckIcon } from "@/assets/svgs/CheckIcon"
import { CloseIcon } from "@/assets/svgs/CloseIcon"
import { PhoneIcon } from "@/assets/svgs/PhoneIcon"
import Svg, { Path } from "react-native-svg"
import { BlurView } from "expo-blur"
import { AntDesign, Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    phone?: string
    email?: string
    password?: string
    confirmPassword?: string
    terms?: string
  }>({})
  const router = useRouter()
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"vendor" | "customer" | "delivery">("customer");

  const roles = [
    { key: "customer", label: "Customer", icon: "user",route:"/auth/signup" },
    { key: "vendor", label: "Vendor", icon: "shop",route:"/vendor/auth/signup" },
    { key: "delivery", label: "Delivery", icon: "truck",route:"/delivery/auth/signup" },
  ];


  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!name) {
      newErrors.name = "Name is required"
    }

    if (!phoneNumber || !validatePhone(phoneNumber)) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the terms"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailSignUp = async () => {
    // if (!validateForm()) return
    setShowPhoneModal(true)
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
    return phoneRegex.test(phone.replace(/\s/g, ""))
  }

  const handleConfirmPhone = async () => {

    setIsVerifying(true)

    try {
      // await onEmailSignUp?.(name, email, password, phoneNumber)
      setShowPhoneModal(false)
      router.push(`/otp-verify?phone=${phoneNumber}`)
    } catch (error) {
      console.error("Sign up error:", error)
      setPhoneError("Failed to create account. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    try {
      // await onGoogleSignUp?.()
    } catch (error) {
      console.error("Google sign up error:", error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View className="flex-1 px-6 pt-8 pb-8">

            {/* sticky switch button */}
            <View className="absolute top-0 right-4 flex-row bg-gray-100 rounded-full p-1 shadow-md">
              {roles.map(({ key, icon, label,route }) => {
                const isActive = selectedRole === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={()=>router.push(route)}
                    className={`flex-row items-center justify-center px-3 py-2 rounded-full ${isActive ? 'bg-green-500 shadow-lg' : 'bg-gray-100'}`}
                    activeOpacity={0.8}
                  >
                    <AntDesign name={icon as any} size={16} color={isActive ? "white" : "black"} />
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Header Section */}
            <View className="items-center pt-4 mb-6">
              <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6 shadow-lg">
                <GroceryLogo />
              </View>
              <Text className="text-black text-2xl font-bold tracking-tight">Join SrMart</Text>
              <Text className="text-black text-sm mt-1 text-center">Start saving on fresh groceries today</Text>
            </View>

            {/* Google Sign Up Button */}
            <TouchableOpacity
              onPress={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className="flex-row items-center justify-center bg-white py-4 rounded-2xl mb-5 active:opacity-80 shadow-sm border border-gray-300"
              activeOpacity={0.8}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#16a34a" />
              ) : (
                <>
                  <GoogleLogo />
                  <Text className="text-gray-800 text-base font-semibold ml-3">Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-emerald-800" />
              <Text className="text-emerald-400 text-sm mx-4">or</Text>
              <View className="flex-1 h-px bg-emerald-800" />
            </View>

            {/* Name Input */}
            <View className="mb-3">
              <Text className="text-black text-sm font-medium mb-2 ml-1">Full Name</Text>
              <View
                className={`flex-row items-center bg-white rounded-2xl px-4 border ${errors.name ? "border-red-400" : "border-gray-300"
                  }`}
              >
                <UserIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-black text-base bg-white"
                  placeholder="Enter your name"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={(text) => {
                    setName(text)
                    if (errors.name) setErrors({ ...errors, name: undefined })
                  }}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && <Text className="text-red-400 text-xs mt-1 ml-1">{errors.name}</Text>}
            </View>

            {/* Phone Input */}
            <View className="mb-3">
              <Text className="text-black text-sm font-medium mb-2 ml-1">Phone No.</Text>
              <View
                className={`flex-row items-center bg-white rounded-2xl px-4 border ${errors.name ? "border-red-400" : "border-gray-300"
                  }`}
              >
                <PhoneIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-black text-base bg-white"
                  placeholder="Enter your number"
                  placeholderTextColor="#666"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text)
                    if (errors.name) setErrors({ ...errors, phone: undefined })
                  }}
                  autoCapitalize="words"
                />
              </View>
              {errors.phone && <Text className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</Text>}
            </View>

            {/* Email Input */}
            <View className="mb-3">
              <Text className="text-black text-sm font-medium mb-2 ml-1">Email</Text>
              <View
                className={`flex-row items-center bg-white rounded-2xl px-4 border ${errors.email ? "border-red-400" : "border-gray-300"
                  }`}
              >
                <EmailIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-black text-base bg-white"
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
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
              {errors.email && <Text className="text-red-400 text-xs mt-1 ml-1">{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View className="mb-3">
              <Text className="text-black text-sm font-medium mb-2 ml-1">Password</Text>
              <View
                className={`flex-row items-center bg-white rounded-2xl px-4 border ${errors.password ? "border-red-400" : "border-gray-300"
                  }`}
              >
                <LockIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-black text-base bg-white"
                  placeholder="Create a password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text)
                    if (errors.password) setErrors({ ...errors, password: undefined })
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {errors.password && <Text className="text-red-400 text-xs mt-1 ml-1">{errors.password}</Text>}
            </View>

            {/* Confirm Password Input */}
            <View className="mb-4">
              <Text className="text-black text-sm font-medium mb-2 ml-1">Confirm Password</Text>
              <View
                className={`flex-row items-center bg-white rounded-2xl px-4 border ${errors.confirmPassword ? "border-red-400" : "border-gray-300"
                  }`}
              >
                <LockIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-black text-base bg-white"
                  placeholder="Confirm your password"
                  placeholderTextColor="#666"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text)
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined })
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {errors.confirmPassword && (
                <Text className="text-red-400 text-xs mt-1 ml-1">{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              onPress={() => {
                setAgreeToTerms(!agreeToTerms)
                if (errors.terms) setErrors({ ...errors, terms: undefined })
              }}
              className="flex-row items-start mb-6"
            >
              <CheckIcon checked={agreeToTerms} />
              <Text className="text-emerald-300 text-sm ml-3 flex-1 leading-5">
                I agree to the <Text className="text-green-400 font-medium">Terms of Service</Text> and{" "}
                <Text className="text-green-400 font-medium">Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text className="text-red-400 text-xs -mt-4 mb-4 ml-1">{errors.terms}</Text>}

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleEmailSignUp}
              disabled={isLoading}
              className="bg-green-500 py-4 rounded-2xl items-center active:opacity-80 shadow-lg"
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Footer Section */}
            <View className="flex-row items-center justify-center mt-6 pb-4">
              <Text className="text-emerald-400 text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className="text-green-400 text-sm font-bold">Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showPhoneModal && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      <Modal visible={showPhoneModal} transparent animationType="fade" onRequestClose={() => setShowPhoneModal(false)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="bg-white w-full rounded-3xl p-6 flex gap-2">
            {/* Modal Header */}
            <View className="flex-row items-center">
              <Text className="text-black text-xl font-bold text-center flex-1">Confirm Phone Number</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPhoneModal(false)
                  setPhoneNumber("")
                  setPhoneError("")
                }}
                className="p-1 absolute right-0"
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            {/* Modal Description */}
            <View className="text-center mb-4">
              <Text className="text-gray-600 text-sm leading-5 text-center">
                We will send the authentication code to
              </Text>
              <Text className="text-gray-600 text-sm leading-5 text-center">
                the phone number you entered.
              </Text>
              <Text className="text-gray-600 text-sm leading-5 text-center">
                Do you want continue?
              </Text>
            </View>


            {/* Phone Number */}
            <View className="mb-4">
              <Text className="text-3xl font-bold text-center text-black">{"987654321"}</Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={() => {
                  setShowPhoneModal(false)
                  setPhoneNumber("")
                  setPhoneError("")
                }}
                className="flex-1 bg-transparent py-4 rounded-2xl items-center border border-emerald-600"
                activeOpacity={0.8}
              >
                <Text className="text-emerald-600 text-base font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmPhone}
                disabled={isVerifying}
                className="flex-1 bg-green-500 py-4 rounded-2xl items-center"
                activeOpacity={0.8}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-bold">Confirm</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Privacy Note */}
            <Text className="text-emerald-500 text-xs text-center mt-4">
              We'll only use your number for delivery updates and account security.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
