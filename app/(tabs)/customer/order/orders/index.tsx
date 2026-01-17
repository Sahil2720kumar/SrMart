import OrderCard from "@/components/OrderCard"
import { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, FlatList } from "react-native"

// ============= MOCK DATA =============
type Order = {
  id: string
  orderNumber: string
  date: string
  time: string
  status: "ordered" | "processing" | "shipped" | "out_for_delivery" | "delivered"
  itemCount: number
  totalAmount: number
  items: OrderItem[]
}

type OrderItem = {
  id: string
  name: string
  weight: string
  price: number
  quantity: number
}

type DeliveryBoy = {
  name: string
  phone: string
  rating: number
}

type OrderStatus = {
  status: string
  date: string
  time: string
  completed: boolean
}

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2025-001",
    date: "Jan 15, 2026",
    time: "10:30 AM",
    status: "delivered",
    itemCount: 3,
    totalAmount: 42.5,
    items: [
      { id: "1", name: "Fortune Sun Lite Refined Sunflower Oil", weight: "5 L", price: 12, quantity: 1 },
      { id: "2", name: "Aashirvaad Shudh Aata", weight: "10 kg", price: 12, quantity: 2 },
      { id: "3", name: "Tata Salt", weight: "1 kg", price: 6.5, quantity: 1 },
    ],
  },
  {
    id: "2",
    orderNumber: "ORD-2025-002",
    date: "Jan 16, 2026",
    time: "02:15 PM",
    status: "out_for_delivery",
    itemCount: 2,
    totalAmount: 28,
    items: [
      { id: "1", name: "Nescafe Classic Coffee", weight: "200g", price: 8, quantity: 1 },
      { id: "2", name: "Britannia Good Day Cookies", weight: "500g", price: 20, quantity: 1 },
    ],
  },
  {
    id: "3",
    orderNumber: "ORD-2025-003",
    date: "Jan 17, 2026",
    time: "09:45 AM",
    status: "processing",
    itemCount: 4,
    totalAmount: 65,
    items: [
      { id: "1", name: "Surf Excel Detergent", weight: "1 kg", price: 15, quantity: 2 },
      { id: "2", name: "Dove Soap", weight: "125g", price: 10, quantity: 3 },
      { id: "3", name: "Colgate Toothpaste", weight: "200g", price: 5, quantity: 1 },
    ],
  },
]

const deliveryBoy: DeliveryBoy = {
  name: "Rajesh Kumar",
  phone: "+91 98765 43210",
  rating: 4.8,
}

// ============= ORDERS LIST SCREEN =============
export default function OrdersListScreen({ navigation }: { navigation?: any }) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600"
      case "out_for_delivery":
        return "text-blue-600"
      case "shipped":
        return "text-purple-600"
      case "processing":
        return "text-orange-600"
      case "ordered":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered"
      case "out_for_delivery":
        return "Out for Delivery"
      case "shipped":
        return "Shipped"
      case "processing":
        return "Processing"
      case "ordered":
        return "Ordered"
      default:
        return status
    }
  }

  const filteredOrders = mockOrders.filter((order) => {
    if (activeTab === "all") return true
    if (activeTab === "active") return order.status !== "delivered"
    if (activeTab === "completed") return order.status === "delivered"
    return true
  })



  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}

      {/* Tabs */}
      <View className="bg-white px-4 py-3 flex-row gap-2 mt-4 mb-2">
        <TouchableOpacity
          onPress={() => setActiveTab("all")}
          className={`flex-1 py-2 rounded-full ${activeTab === "all" ? "bg-green-500" : "bg-gray-100"
            }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${activeTab === "all" ? "text-white" : "text-gray-600"
              }`}
          >
            All Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("active")}
          className={`flex-1 py-2 rounded-full ${activeTab === "active" ? "bg-green-500" : "bg-gray-100"
            }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${activeTab === "active" ? "text-white" : "text-gray-600"
              }`}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("completed")}
          className={`flex-1 py-2 rounded-full ${activeTab === "completed" ? "bg-green-500" : "bg-gray-100"
            }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${activeTab === "completed" ? "text-white" : "text-gray-600"
              }`}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={({ item }) => <OrderCard item={item} getStatusColor={getStatusColor} getStatusText={getStatusText} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}



