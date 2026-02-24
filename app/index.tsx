import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router, Stack, Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

const { width } = Dimensions.get('window');

const BRAND_LETTERS = 'SrMart'.split('');
const TAGLINE = 'Your groceries, delivered fresh';

// Must be >= total animation duration (~1800ms) + buffer
const MIN_SPLASH_DURATION = 2000;

const onboardingData = [
  {
    title: 'Fresh groceries,\nright to your door',
    description: 'Daily essentials delivered fast with care',
    lottie: require('@/assets/json/Fresh groceries,right to your door.json'),
  },
  {
    title: 'Trusted quality\nfrom verified sellers',
    description: 'Handpicked products you can rely on',
    lottie: require('@/assets/json/Verification.json'),
  },
  {
    title: 'Save more\neveryday',
    description: 'Exclusive deals and smart prices',
    lottie: require('@/assets/json/Save more everyday.json'),
  },
];

// ─── Single letter: slide-up + fade ──────────────────────────────────────────
function RevealLetter({ char, index }: { char: string; index: number }) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 80;
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[animStyle, { fontSize: 40, fontWeight: '800', color: 'white', letterSpacing: 0.5 }]}
    >
      {char}
    </Animated.Text>
  );
}

// ─── Tagline: word-by-word fade-in ───────────────────────────────────────────
function RevealTagline() {
  const words = TAGLINE.split(' ');
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
      {words.map((word, i) => (
        <Animated.Text
          key={i}
          entering={FadeInDown.delay(600 + i * 100).duration(400).easing(Easing.out(Easing.ease))}
          style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginHorizontal: 3 }}
        >
          {word}
        </Animated.Text>
      ))}
    </View>
  );
}

// ─── Progress bar: fills left→right, fires onComplete at the end ─────────────
function LoadingBar({ onComplete }: { onComplete: () => void }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      800,
      withSequence(
        withTiming(0.6, { duration: 600, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }, (finished) => {
          if (finished) runOnJS(onComplete)();
        })
      )
    );
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(750).duration(300)}
      style={{
        marginTop: 48,
        width: 160,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 99,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[fillStyle, { height: '100%', backgroundColor: 'white', borderRadius: 99 }]}
      />
    </Animated.View>
  );
}

// ─── Splash: receives all readiness flags, exits only when everything is ready ─
function SplashScreen({
  dataReady,
  authReady,
  onDone,
}: {
  dataReady: boolean;
  authReady: boolean;
  onDone: () => void;
}) {
  const [barComplete, setBarComplete] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const opacity = useSharedValue(1);

  // Minimum display timer — ensures animation plays fully
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // Gate: all four conditions must be true before we fade out
  useEffect(() => {
    if (barComplete && minTimeElapsed && dataReady && authReady && !exiting) {
      setExiting(true);
      opacity.value = withDelay(
        100,
        withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) }, (finished) => {
          if (finished) runOnJS(onDone)();
        })
      );
    }
  }, [barComplete, minTimeElapsed, dataReady, authReady]);

  const wrapStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        wrapStyle,
        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16a34a' },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Icon pops in */}
      <Animated.View
        entering={FadeInDown.delay(0).duration(500).easing(Easing.out(Easing.back(1.4)))}
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: 'rgba(255,255,255,0.2)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Feather name="shopping-bag" size={36} color="white" />
      </Animated.View>

      {/* Letter-by-letter brand name */}
      <View style={{ flexDirection: 'row', overflow: 'hidden' }}>
        {BRAND_LETTERS.map((char, i) => (
          <RevealLetter key={i} char={char} index={i} />
        ))}
      </View>

      {/* Tagline */}
      <RevealTagline />

      {/* Bar — signals animation completion */}
      <LoadingBar onComplete={() => setBarComplete(true)} />
    </Animated.View>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function Index() {
  const { initialized } = useAuthStore();
  const { user } = useProfileStore();

  const [splashDone, setSplashDone] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  const [slideIndex, setSlideIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const lottieRefs = useRef<(LottieView | null)[]>([]);

  // Fetch onboarding flag — splash stays visible regardless of how fast this resolves
  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then(value => {
      setOnboardingDone(value === 'true');
      setDataReady(true);
    });
  }, []);

  useEffect(() => {
    lottieRefs.current[slideIndex]?.play();
  }, [slideIndex]);

  // ── Always render SplashScreen until it signals onDone ──────────────────────
  // This replaces the old conditional that caused the double-splash:
  // Previously: `if (loading || !initialized) return <ActivityIndicator ...>`
  // Now: SplashScreen is always rendered first and waits for authReady itself.
  if (!splashDone) {
    return (
      <SplashScreen
        dataReady={dataReady}
        authReady={initialized}
        onDone={() => setSplashDone(true)}
      />
    );
  }

  // ── Post-splash redirects ────────────────────────────────────────────────────
  if (onboardingDone) {
    if (!user) return <Redirect href="/auth/login" />;
    if (user.role === 'customer') return <Redirect href="/(tabs)/customer" />;
    if (user.role === 'vendor') return <Redirect href="/vendor/dashboard" />;
    if (user.role === 'delivery_boy') return <Redirect href="/delivery/home" />;
  }

  const next = async () => {
    if (slideIndex < onboardingData.length - 1) {
      const nextIndex = slideIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setSlideIndex(nextIndex);
    } else {
      await AsyncStorage.setItem('onboarding_done', 'true');
      setOnboardingDone(true);
    }
  };

  // 👋 ONBOARDING
  if (!onboardingDone) {
    return (
      <LinearGradient colors={['#f0fdf4', '#ffffff']} className="flex-1">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />

        <SafeAreaView className="flex-1">
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              setSlideIndex(newIndex);
            }}
          >
            {onboardingData.map((item, i) => (
              <View key={i} style={{ width }} className="flex-1 items-center justify-center px-8">
                <LottieView
                  ref={(ref) => { lottieRefs.current[i] = ref; }}
                  source={item.lottie}
                  autoPlay={i === 0}
                  loop
                  style={{ width: width * 0.75, height: width * 0.75 }}
                />
                <Text className="text-4xl font-extrabold text-gray-900 text-center leading-tight mb-4 mt-2">
                  {item.title}
                </Text>
                <Text className="text-base text-gray-500 text-center leading-6 max-w-sm">
                  {item.description}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View className="flex-row justify-center mb-6">
            {onboardingData.map((_, i) => (
              <View
                key={i}
                className={`mx-1 rounded-full ${i === slideIndex ? 'w-6 bg-green-600' : 'w-2 bg-gray-300'} h-2`}
              />
            ))}
          </View>

          {/* CTA */}
          <View className="px-6 pb-10">
            <TouchableOpacity
              onPress={next}
              className="bg-green-600 rounded-2xl py-4 flex-row justify-center items-center"
            >
              <Text className="text-white font-bold text-lg mr-2">
                {slideIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Feather name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // 👇 WELCOME SCREEN
  return (
    <SafeAreaView className="flex-1 bg-green-600 justify-between px-6 py-12">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <View className="items-center mt-12">
        <View className="bg-white/20 p-6 rounded-full mb-6">
          <Feather name="shopping-bag" size={48} color="white" />
        </View>
        <Text className="text-5xl font-extrabold text-white mb-3 text-center">FreshMart</Text>
        <Text className="text-green-100 text-center max-w-xs text-base leading-6">
          Groceries delivered fresh & fast, straight to your door
        </Text>
      </View>

      <View>
        <TouchableOpacity
          onPress={() => router.push('/auth/sign-up')}
          className="bg-white rounded-2xl py-4 mb-6 flex-row justify-center items-center shadow-lg"
        >
          <Text className="text-green-600 font-bold text-lg mr-2">Continue as Customer</Text>
          <Feather name="chevron-right" size={22} color="#16a34a" />
        </TouchableOpacity>

        {['Fast delivery', 'Secure payments', 'Fresh quality'].map((t, i) => (
          <View key={i} className="flex-row items-center mb-3 bg-white/10 p-4 rounded-2xl">
            <Feather name="check-circle" size={20} color="white" />
            <Text className="text-white ml-3 font-medium">{t}</Text>
          </View>
        ))}

        <TouchableOpacity onPress={() => router.push('/auth/login')} className="mt-8 items-center">
          <Text className="text-white/80">
            Already have an account?{' '}
            <Text className="font-bold text-white">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}