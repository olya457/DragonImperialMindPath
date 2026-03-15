import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/od1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const KEY_CHARACTER = 'selected_character_v2';
const KEY_CHARACTER_CHANGED_AT = 'selected_character_changed_at_v2';

type Props = BottomTabScreenProps<MainTabParamList, 'ChangeCharacter'>;
type CharacterType = 'empress' | 'emperor';

const GOLD = '#F5D37A';
const GOLD_SOFT = 'rgba(245,211,122,0.22)';
const GOLD_LINE = 'rgba(245,211,122,0.40)';
const PANEL = 'rgba(30, 8, 4, 0.68)';
const PANEL_SOFT = 'rgba(52, 20, 10, 0.56)';
const TEXT_MAIN = '#FFF8ED';
const TEXT_SUB = 'rgba(255,248,237,0.72)';
const TEXT_DIM = 'rgba(255,248,237,0.55)';
const BROWN = '#2B1200';
const ACCENT_GREEN = '#3DDC84';

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(date: Date) {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getCharacterLabel(value: CharacterType) {
  return value === 'empress' ? 'Empress Path' : 'Emperor Path';
}

function getCharacterSubtitle(value: CharacterType) {
  return value === 'empress'
    ? 'A calm and elegant guide style with a graceful visual presence.'
    : 'A bold and steady guide style with a stronger visual presence.';
}

export default function ChangeCharacterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isTinyH = height <= 640;
  const isSmallH = height <= 720;
  const isSmallW = width <= 360;

  const sidePad = clamp(width * 0.045, 14, 22);
  const contentW = Math.min(470, width - sidePad * 2);

  const topPad = Math.max(insets.top + 4, 10);
  const bottomPad = Math.max(insets.bottom + 10, 16);

  const headerImageSize = isTinyH ? 54 : isSmallH ? 58 : 64;
  const mainAvatarSize = isTinyH ? 88 : isSmallH ? 96 : 110;
  const smallAvatarSize = isTinyH ? 34 : 38;

  const titleFont = isTinyH ? 21 : isSmallW ? 23 : 25;
  const bodyFont = isTinyH ? 13 : 14;
  const buttonFont = isTinyH ? 16 : 18;

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>('empress');
  const [loaded, setLoaded] = useState(false);
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const storedCharacter = await AsyncStorage.getItem(KEY_CHARACTER);
        const storedChangedAt = await AsyncStorage.getItem(KEY_CHARACTER_CHANGED_AT);

        if (!mounted) return;

        if (storedCharacter === 'empress' || storedCharacter === 'emperor') {
          setSelectedCharacter(storedCharacter);
        }

        if (storedChangedAt) {
          setLastChangedAt(storedChangedAt);
        }
      } catch {
      } finally {
        if (mounted) setLoaded(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const todayStr = useMemo(() => formatDate(new Date()), []);
  const currentAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;

  const statusText = useMemo(() => {
    if (!loaded) return 'Loading profile state...';
    if (lastChangedAt) return `Last updated on ${lastChangedAt}`;
    return 'Character has not been changed yet';
  }, [loaded, lastChangedAt]);

  const currentLabel = useMemo(
    () => getCharacterLabel(selectedCharacter),
    [selectedCharacter]
  );

  const currentSubtitle = useMemo(
    () => getCharacterSubtitle(selectedCharacter),
    [selectedCharacter]
  );

  const onChangeCharacter = useCallback(() => {
    navigation.getParent()?.navigate('Choose' as never);
  }, [navigation]);

  const onKeepCurrent = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: topPad,
            paddingBottom: bottomPad + 90,
            paddingHorizontal: sidePad,
          }}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { width: contentW, alignSelf: 'center' }]}>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View
                  style={[
                    styles.headerThumbWrap,
                    { width: headerImageSize, height: headerImageSize, borderRadius: 18 },
                  ]}
                >
                  <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
                </View>

                <View style={styles.heroTitleWrap}>
                  <Text style={[styles.heroEyebrow, { fontSize: isTinyH ? 11 : 12 }]}>
                    CHARACTER SETTINGS
                  </Text>
                  <Text style={[styles.heroTitle, { fontSize: titleFont }]}>
                    Update your guide identity
                  </Text>
                  <Text style={[styles.heroDate, { fontSize: isTinyH ? 11 : 12 }]}>
                    Session date: {todayStr}
                  </Text>
                </View>

                <View style={styles.liveDotWrap}>
                  <View style={styles.liveDot} />
                </View>
              </View>

              <Text
                style={[
                  styles.heroDescription,
                  { fontSize: bodyFont, lineHeight: bodyFont * 1.5 },
                ]}
              >
                You can keep your current guide or switch to another character style. The selected
                guide affects the visual mood and presentation of your experience.
              </Text>
            </View>

            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View
                  style={[
                    styles.mainAvatarWrap,
                    { width: mainAvatarSize, height: mainAvatarSize, borderRadius: 26 },
                  ]}
                >
                  <Image source={currentAvatar} style={styles.mainAvatar} resizeMode="contain" />
                </View>

                <View style={styles.profileTextWrap}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>CURRENT GUIDE</Text>
                  </View>

                  <Text style={[styles.profileTitle, { fontSize: isTinyH ? 18 : 20 }]}>
                    {currentLabel}
                  </Text>

                  <Text
                    style={[
                      styles.profileSubtitle,
                      { fontSize: bodyFont, lineHeight: bodyFont * 1.5 },
                    ]}
                  >
                    {currentSubtitle}
                  </Text>

                  <Text style={[styles.profileMeta, { fontSize: isTinyH ? 11 : 12 }]}>
                    {statusText}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={[styles.infoTitle, { fontSize: isTinyH ? 15 : 16 }]}>
                What changes after switching
              </Text>

              <View style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={[styles.infoText, { fontSize: bodyFont }]}>
                  Updated character portrait in related screens
                </Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={[styles.infoText, { fontSize: bodyFont }]}>
                  A different visual tone for your in-app guide
                </Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={[styles.infoText, { fontSize: bodyFont }]}>
                  Your choice stays saved locally for future app sessions
                </Text>
              </View>
            </View>

            <View style={styles.compareCard}>
              <Text style={[styles.compareTitle, { fontSize: isTinyH ? 15 : 16 }]}>
                Available character styles
              </Text>

              <View style={styles.compareGrid}>
                <View style={styles.compareItem}>
                  <View
                    style={[
                      styles.compareAvatarWrap,
                      {
                        width: smallAvatarSize + 18,
                        height: smallAvatarSize + 18,
                        borderRadius: 14,
                      },
                    ]}
                  >
                    <Image source={AV_LEFT} style={styles.compareAvatar} resizeMode="contain" />
                  </View>
                  <Text style={styles.compareName}>Empress Path</Text>
                  <Text style={styles.compareDesc}>Elegant, soft, balanced</Text>
                </View>

                <View style={styles.compareItem}>
                  <View
                    style={[
                      styles.compareAvatarWrap,
                      {
                        width: smallAvatarSize + 18,
                        height: smallAvatarSize + 18,
                        borderRadius: 14,
                      },
                    ]}
                  >
                    <Image source={AV_RIGHT} style={styles.compareAvatar} resizeMode="contain" />
                  </View>
                  <Text style={styles.compareName}>Emperor Path</Text>
                  <Text style={styles.compareDesc}>Bold, steady, focused</Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonsWrap}>
              <Pressable
                onPress={onChangeCharacter}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={[styles.primaryBtnText, { fontSize: buttonFont }]}>
                  Change character
                </Text>
              </Pressable>

              <Pressable
                onPress={onKeepCurrent}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={[styles.secondaryBtnText, { fontSize: buttonFont - 1 }]}>
                  Keep current guide
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
  },

  container: {
    gap: 14,
  },

  heroCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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

  heroTitleWrap: {
    flex: 1,
    paddingTop: 1,
  },

  heroEyebrow: {
    color: GOLD,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 4,
  },

  heroTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    lineHeight: 29,
  },

  heroDate: {
    color: TEXT_DIM,
    fontWeight: '700',
    marginTop: 6,
  },

  liveDotWrap: {
    paddingLeft: 10,
    paddingTop: 6,
  },

  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: ACCENT_GREEN,
  },

  heroDescription: {
    color: TEXT_SUB,
    fontWeight: '700',
    marginTop: 14,
  },

  profileCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GOLD_LINE,
    padding: 14,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  mainAvatarWrap: {
    backgroundColor: PANEL_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginRight: 14,
    overflow: 'hidden',
  },

  mainAvatar: {
    width: '100%',
    height: '100%',
  },

  profileTextWrap: {
    flex: 1,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: GOLD_SOFT,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.24)',
    marginBottom: 8,
  },

  badgeText: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.8,
  },

  profileTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
  },

  profileSubtitle: {
    color: TEXT_SUB,
    fontWeight: '700',
    marginTop: 6,
  },

  profileMeta: {
    color: TEXT_DIM,
    fontWeight: '700',
    marginTop: 8,
  },

  infoCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 14,
  },

  infoTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    marginBottom: 10,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },

  infoBullet: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: GOLD,
    marginTop: 6,
    marginRight: 10,
  },

  infoText: {
    flex: 1,
    color: TEXT_SUB,
    fontWeight: '700',
    lineHeight: 20,
  },

  compareCard: {
    backgroundColor: PANEL,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 14,
  },

  compareTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    marginBottom: 12,
  },

  compareGrid: {
    flexDirection: 'row',
    gap: 10,
  },

  compareItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },

  compareAvatarWrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },

  compareAvatar: {
    width: '100%',
    height: '100%',
  },

  compareName: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 13,
    textAlign: 'center',
  },

  compareDesc: {
    color: TEXT_DIM,
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },

  buttonsWrap: {
    marginTop: 4,
    gap: 10,
  },

  primaryBtn: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  primaryBtnText: {
    color: BROWN,
    fontWeight: '900',
  },

  secondaryBtn: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  secondaryBtnText: {
    color: TEXT_MAIN,
    fontWeight: '900',
  },

  btnPressed: {
    transform: [{ scale: 0.988 }],
    opacity: 0.96,
  },
});
