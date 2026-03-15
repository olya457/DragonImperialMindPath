import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
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
const HEADER_IMG = require('../assets/onboard1.png');

const GOLD = '#F5D37A';
const PANEL = 'rgba(34, 10, 6, 0.66)';
const PANEL_SOFT = 'rgba(54, 18, 10, 0.56)';
const TEXT_MAIN = '#FFF8ED';
const TEXT_SUB = 'rgba(255,248,237,0.74)';
const GREEN = '#2ED573';

export default function LoaderScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();

  const fade = useRef(new Animated.Value(0)).current;
  const moveY = useRef(new Animated.Value(12)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const introAnim = Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(moveY, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1.03,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.98,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    introAnim.start();
    pulseAnim.start();

    const progressAnim = Animated.timing(progress, {
      toValue: 1,
      duration: 3600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });

    progressAnim.start(({ finished }) => {
      if (finished) {
        navigation.replace('Onboard');
      }
    });

    return () => {
      pulseAnim.stop();
      progress.stopAnimation();
    };
  }, [fade, moveY, logoScale, glow, progress, navigation]);

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;
  const isSmallW = width <= 360;

  const cardW = Math.min(440, width - 28);
  const logoSize = Math.round(
    Math.min(width * (isSmallW ? 0.35 : 0.4), isTinyH ? 132 : isSmallH ? 150 : 184)
  );

  const headerThumbSize = isTinyH ? 48 : isSmallH ? 54 : 58;
  const titleSize = isTinyH ? 22 : isSmallW ? 24 : 26;
  const subtitleSize = isTinyH ? 12 : 13;

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const statusOpacity = progress.interpolate({
    inputRange: [0, 0.15, 0.4, 0.7, 1],
    outputRange: [0.55, 0.72, 0.85, 0.92, 1],
  });

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[
            styles.center,
            {
              opacity: fade,
              transform: [{ translateY: moveY }],
            },
          ]}
        >
          <View style={[styles.topCard, { width: cardW, marginBottom: isTinyH ? 16 : 22 }]}>
            <View style={styles.topRow}>
              <View
                style={[
                  styles.headerThumbWrap,
                  {
                    width: headerThumbSize,
                    height: headerThumbSize,
                    borderRadius: 16,
                  },
                ]}
              >
                <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>IMPERIAL SESSION</Text>
                <Text style={[styles.title, { fontSize: titleSize }]}>
                  Golden Dragon Way
                </Text>
                <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
                  Preparing your experience and restoring your daily path.
                </Text>
              </View>

              <View style={styles.liveDot} />
            </View>
          </View>

          <Animated.View
            style={[
              styles.logoCard,
              {
                width: logoSize + 28,
                height: logoSize + 28,
                borderRadius: 32,
                transform: [{ scale: logoScale }, { scale: glow }],
              },
            ]}
          >
            <View style={[styles.logoWrap, { width: logoSize, height: logoSize, borderRadius: 28 }]}>
              <Image source={LOGO} style={styles.logo} resizeMode="cover" />
            </View>
          </Animated.View>

          <View style={[styles.bottomCard, { width: cardW, marginTop: isTinyH ? 18 : 24 }]}>
            <Animated.Text style={[styles.statusText, { opacity: statusOpacity }]}>
              Loading archive, guide state, and daily modules...
            </Animated.Text>

            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            <Text style={styles.hintText}>
              Please wait while the app prepares your next screen.
            </Text>
          </View>
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
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 22,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topCard: {
    borderRadius: 24,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerThumbWrap: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 12,
  },

  headerThumb: {
    width: '100%',
    height: '100%',
  },

  eyebrow: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },

  title: {
    color: TEXT_MAIN,
    fontWeight: '900',
    lineHeight: 30,
  },

  subtitle: {
    color: TEXT_SUB,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 18,
  },

  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: GREEN,
    marginLeft: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },

  logoCard: {
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  logoWrap: {
    overflow: 'hidden',
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  bottomCard: {
    borderRadius: 24,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.30)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  statusText: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },

  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: GOLD,
  },

  hintText: {
    marginTop: 10,
    color: TEXT_SUB,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
