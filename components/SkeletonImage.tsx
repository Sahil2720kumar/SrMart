import { View } from "react-native"

type SkeletonSize = "small" | "medium" | "large" | "xlarge"

interface SkeletonImageProps {
  size?: SkeletonSize
}

export default function SkeletonImage({ 
  size = "medium"
}: SkeletonImageProps) {
  
  const sizeConfig = {
    small: { container: "w-16 h-16", inner: "w-6 h-6" },
    medium: { container: "w-24 h-24", inner: "w-10 h-10" },
    large: { container: "w-32 h-32", inner: "w-16 h-16" },
    xlarge: { container: "w-64 h-64", inner: "w-24 h-24" },
  }

  const { container, inner } = sizeConfig[size]

  return (
    <View className={`${container} bg-gray-200 rounded-lg items-center justify-center `}>
      <View className={`${inner} bg-gray-300 rounded-md`} />
    </View>
  )
}