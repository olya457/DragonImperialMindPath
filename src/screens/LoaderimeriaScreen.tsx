import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  ImageBackground,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

const BG = require('../assets/bg.png');
const LOGO = require('../assets/logo.png');

export default function LoaderScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const introAnim = Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.045,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.985,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    introAnim.start();
    pulseAnim.start();

    const timer = setTimeout(() => {
      navigation.replace('Onboard');
    }, 2600);

    return () => {
      clearTimeout(timer);
      pulseAnim.stop();
    };
  }, [fade, scale, pulse, navigation]);

  const isTinyH = height <= 640;
  const isSmallH = height <= 700;
  const isSmallW = width <= 360;

  const logoSize = Math.min(
    width * (isSmallW ? 0.52 : 0.58),
    isTinyH ? 170 : isSmallH ? 210 : 250
  );

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[
            styles.logoHolder,
            {
              width: logoSize,
              height: logoSize,
              opacity: fade,
              transform: [{ scale }, { scale: pulse }],
            },
          ]}
        >
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },

  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoHolder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: '100%',
    height: '100%',
  },
});
