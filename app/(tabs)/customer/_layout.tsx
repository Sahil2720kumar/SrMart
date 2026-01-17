import type React from "react"
import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui"
import { View, Text, Pressable } from "react-native"
import { Svg, Path, Circle } from "react-native-svg"
import { usePathname } from "expo-router"
import AntDesign from '@expo/vector-icons/AntDesign';
import Foundation from '@expo/vector-icons/Foundation';

// Tab Icons
function HomeIcon({ focused = false }: { focused?: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3L21 9.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9.5Z"
        stroke={focused ? "#16a34a" : "#9ca3af"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={focused ? "#dcfce7" : "none"}
      />
      <Path
        d="M9 22V12H15V22"
        stroke={focused ? "#16a34a" : "#9ca3af"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function SearchIcon({ focused = false }: { focused?: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={11}
        cy={11}
        r={8}
        stroke={focused ? "#16a34a" : "#9ca3af"}
        strokeWidth={2}
        fill={focused ? "#dcfce7" : "none"}
      />
      <Path
        d="M21 21L16.65 16.65"
        stroke={focused ? "#16a34a" : "#9ca3af"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function CartIcon({ focused = false, itemCount = 0 }: { focused?: boolean; itemCount?: number }) {
  return (
    <View className="relative">
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
          stroke={focused ? "#16a34a" : "#9ca3af"}
          strokeWidth={2}
          fill={focused ? "#16a34a" : "#9ca3af"}
        />
        <Path
          d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
          stroke={focused ? "#16a34a" : "#9ca3af"}
          strokeWidth={2}
          fill={focused ? "#16a34a" : "#9ca3af"}
        />
        <Path
          d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6"
          stroke={focused ? "#16a34a" : "#9ca3af"}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={focused ? "#dcfce7" : "none"}
        />
      </Svg>
      {itemCount > 0 && (
        <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
          <Text className="text-white text-xs font-bold">{itemCount > 9 ? "9+" : itemCount}</Text>
        </View>
      )}
    </View>
  )
}

function OrdersIcon({ focused = false }: { focused?: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
        stroke={focused ? "#16a34a" : "#9ca3af"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={focused ? "#dcfce7" : "none"}
      />
      <Path
        d="M14 2V8H20"
        stroke={focused ? "#16a34a" : "#9ca3af"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 13H8" stroke={focused ? "#16a34a" : "#9ca3af"} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 17H8" stroke={focused ? "#16a34a" : "#9ca3af"} strokeWidth={2} strokeLinecap="round" />
      <Path d="M10 9H8" stroke={focused ? "#16a34a" : "#9ca3af"} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function ProfileIcon({ focused = false }: { focused?: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
        stroke={focused ? "#16a34a" : "#9ca3af"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={12}
        cy={7}
        r={4}
        stroke={focused ? "#16a34a" : "#9ca3af"}
        strokeWidth={2}
        fill={focused ? "#dcfce7" : "none"}
      />
    </Svg>
  )
}

// Custom Tab Button Component
function TabButton({
  children,
  label,
  focused,
}: {
  children: React.ReactNode
  label: string
  focused: boolean
}) {
  return (
    <View className="flex-1 items-center justify-center py-2">
      <View
        className={`items-center justify-center px-4 py-1.5 rounded-full ${focused ? "" : "bg-transparent"}`}
      >
        {children}
      </View>
      <Text className={`text-xs mt-1 font-medium ${focused ? "text-green-600" : "text-gray-400"}`}>{label}</Text>
    </View>
  )
}

export default function TabLayout() {
  const pathname = usePathname();
  console.log(pathname);

  return (
    <Tabs>
      {/* Main content area */}
      <TabSlot />

      {/* Bottom Tab Bar */}
      <TabList
        style={{
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          paddingBottom: 12,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <TabTrigger name="home" href="/(tabs)/customer" asChild>
          <Pressable className="flex-1">
            <TabButton label="Home" focused={pathname === '/customer'}>
              <HomeIcon focused={pathname === "/customer"} />
            </TabButton>
          </Pressable>
        </TabTrigger>

        <TabTrigger name="category" href="/(tabs)/customer/category/index" asChild>
          <Pressable className="flex-1 hidden">
            <TabButton label="Category" focused={pathname === "/(tabs)/customer/category/index"}>
              <SearchIcon focused={pathname === "/(tabs)/customer/category/index"} />
            </TabButton>
          </Pressable>
        </TabTrigger>


        <TabTrigger name="offers" href='/customer/offers/index' asChild>
          <Pressable className="flex-1">
            <TabButton label="offers" focused={pathname.startsWith("/customer/offers")}>
              <Foundation name="burst-sale" size={30} color={pathname.startsWith("/customer/offers") ? "#16a34a" : "#9ca3af"} />
            </TabButton>
          </Pressable>
        </TabTrigger>

        <TabTrigger name="products" href="/customer/products" asChild>
          <Pressable className="flex-1">
            <TabButton label="products" focused={pathname.startsWith("/customer/products")}>
              <AntDesign name="product" size={24} color={pathname.startsWith("/customer/products") ? "#16a34a" : "#9ca3af"} />
            </TabButton>
          </Pressable>
        </TabTrigger>


        <TabTrigger name="search" href="/customer/search" asChild>
          <Pressable className="flex-1 hidden">
            <TabButton label="Search" focused={pathname.startsWith("/customer/search")}>
              <SearchIcon focused={pathname.startsWith("/customer/search")} />
            </TabButton>
          </Pressable>
        </TabTrigger>

        {/* <TabTrigger name="cart" href="/customer/order/cart" asChild>
          <Pressable className="flex-1">
            <TabButton label="Cart" focused={pathname === "/customer/order/cart"}>
              <CartIcon focused={pathname === "/customer/order/cart"} itemCount={3} />
            </TabButton>
          </Pressable>
        </TabTrigger> */}

        <TabTrigger name="orders" href="/customer/order/orders/index" asChild>
          <Pressable className="flex-1">
            <TabButton label="Orders" focused={pathname.startsWith("/customer/order/orders")}>
              <OrdersIcon focused={pathname.startsWith("/customer/order/orders")} />
            </TabButton>
          </Pressable>
        </TabTrigger>

        <TabTrigger name="profile" href="/(tabs)/customer/account" asChild>
          <Pressable className="flex-1">
            <TabButton label="Profile" focused={pathname.startsWith("/customer/account")}>
              <ProfileIcon focused={pathname.startsWith("/customer/account")} />
            </TabButton>
          </Pressable>
        </TabTrigger>

      </TabList>
    </Tabs>
  )
}
