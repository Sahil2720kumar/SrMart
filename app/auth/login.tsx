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

import { LeafDecor } from "@/assets/svgs/LeafDecor"
import { GroceryLogo } from "@/assets/svgs/GroceryLogo"
import { GoogleLogo } from "@/assets/svgs/GoogleLogo"
import { EmailIcon } from "@/assets/svgs/EmailIcon"
import { LockIcon } from "@/assets/svgs/LockIcon"
import { EyeIcon } from "@/assets/svgs/EyeIcon"
import { Redirect, router, Stack } from "expo-router"
import { AntDesign } from "@expo/vector-icons"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/authStore"
import { useCustomerProfile } from "@/hooks/queries"
import { User } from "@/types/users.types"
import { useProfileStore } from "@/store/profileStore"
import Toast from "react-native-toast-message"
import { setupOneSignalUser } from "@/services/onesignal"


export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [selectedRole, setSelectedRole] = useState<"vendor" | "customer" | "delivery">("customer");
  const { setSession } = useAuthStore()
  const { setUser, setCustomerProfile } = useProfileStore()
  const roles = [
    { key: "customer", label: "Customer", icon: "user", route: "/auth/login" },
    { key: "vendor", label: "Vendor", icon: "shop", route: "/vendor/auth/login" },
    { key: "delivery", label: "Delivery", icon: "truck", route: "/delivery/auth/login" },
  ];

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLoginSuccess = (user) => {
    setupOneSignalUser({ id: user.auth_id, role: user.role });
  };


  const handleEmailSignIn = async () => {
    if (!validateForm()) return;
  
    setIsLoading(true);
  
    try {
      /* ---------------- AUTH SIGN IN ---------------- */
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
  
      if (signInError) throw signInError;
      if (!signInData.session || !signInData.user) {
        throw new Error('Login failed');
      }
  
      const authUserId = signInData.user.id;
  
      /* ---------------- FETCH USER ---------------- */
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUserId)
        .maybeSingle();
  
      if (userError) throw userError;
      if (!userData) {
        throw new Error('User profile not found');
      }
  
      /* 🚨 ROLE GUARD (CRITICAL) */
      if (userData.role !== 'customer') {
        throw new Error('This account is not a customer');
      }
  
      /* ---------------- FETCH CUSTOMER ---------------- */
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
  
      if (customerError) throw customerError;
      if (!customerData) {
        throw new Error('Customer profile not found');
      }
  
      /* ---------------- COMMIT STATE (SAFE POINT) ---------------- */
      setSession(signInData.session);
      setUser(userData);
      setCustomerProfile(customerData);
      handleLoginSuccess(userData)
      Toast.show({
        type: "success",
        text1: "Welcome back! 👋",
        text2: "Signed in successfully.",
        position: "top",
      });
  
      router.replace('/customer');
    } catch (error: any) {
  
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: error?.message || "Invalid email or password.",
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View className="flex-1 px-6 pt-12 pb-8 justify-between">

            {/* sticky switch button */}
            <View className="absolute top-0 right-4 flex-row bg-gray-100 rounded-full p-1 shadow-md">
              {roles.map(({ key, icon, label, route }) => {
                const isActive = selectedRole === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => router.push(route as any)}
                    className={`flex-row items-center justify-center px-3 py-2 rounded-full ${isActive ? 'bg-green-500 shadow-lg' : 'bg-gray-100'}`}
                    activeOpacity={0.8}
                  >
                    <AntDesign name={icon as any} size={16} color={isActive ? "white" : "black"} />
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Header Section */}
            <View className="items-center pt-8">
              <View className="absolute top-0 right-0 opacity-30">
                <LeafDecor />
              </View>
              <View className="absolute top-4 left-4 opacity-20 rotate-45">
                <LeafDecor />
              </View>

              <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6 shadow-lg">
                <GroceryLogo />
              </View>
              <Text className="text-black text-3xl font-bold tracking-tight">SrMart</Text>
              <Text className="text-gray-500 text-base mt-2 text-center">Fresh groceries, delivered to your door</Text>
            </View>

            {/* Form Section */}
            <View className="flex-1 justify-center py-8">
              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-gray-500 text-sm font-medium mb-2 ml-1">Email</Text>
                <View
                  className={`flex-row items-center bg-white rounded-2xl px-4 border ${errors.email ? "border-red-400" : "border-gray-300"
                    }`}
                >
                  <EmailIcon />
                  <TextInput
                    className="flex-1 py-4 px-3 text-black text-base focus:outline-none bg-white"
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
              <View className="mb-4">
                <Text className="text-gray-500 text-sm font-medium mb-2 ml-1">Password</Text>
                <View
                  className={`flex-row items-center bg-white rounded-2xl px-4 border ${errors.password ? "border-red-400" : "border-gray-300"
                    }`}
                >
                  <LockIcon />
                  <TextInput
                    className="flex-1 py-4 px-3 text-black text-base focus:outline-none bg-white"
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text)
                      if (errors.password) setErrors({ ...errors, password: undefined })
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                    <EyeIcon visible={showPassword} />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text className="text-red-400 text-xs mt-1 ml-1">{errors.password}</Text>}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity onPress={() => { }} className="self-end mb-6">
                <Text className="text-gray-500 text-sm font-medium">Forgot password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleEmailSignIn}
                disabled={isLoading}
                className="bg-[#5ac268] py-4 rounded-2xl items-center active:opacity-80 shadow-lg border border-gray-300"
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-bold">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Section */}
            <View className="flex-row items-center justify-center pb-4">
              <Text className="text-gray-500 text-sm">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
                <Text className="text-[#5ac268] text-sm font-bold">Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}