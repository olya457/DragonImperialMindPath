import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MainTabParamList } from './types';

import HomeDailyTipsScreen from '../screens/HomeDailyimeriaTipsScreen';
import SavedNoDataScreen from '../screens/SavedNoDataimeriaScreen';
import AdvisorsScreen from '../screens/AdvisorsimeriaScreen';
import GameScreen from '../screens/GameimeriaScreen';
import CollectionScreen from '../screens/CollectionimeriaScreen';
import ChangeCharacterScreen from '../screens/ChangeimeriaCharacterScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const KEY_CHARACTER = 'selected_character_v1';

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const ICONS = {
  HomeDailyTips: {
    off: require('../assets/home_off.png'),
    on: require('../assets/home_on.png'),
  },
  SavedNoData: {
    off: require('../assets/saved_off.png'),
    on: require('../assets/saved_on.png'),
  },
  Advisors: {
    off: require('../assets/advisors_off.png'),
    on: require('../assets/advisors_on.png'),
  },
  Game: {
    off: require('../assets/game_off.png'),
    on: require('../assets/game_on.png'),
  },
  Collection: {
    off: require('../assets/collection_off.png'),
    on: require('../assets/collection_on.png'),
  },
  ChangeCharacter: {},
} as const;

type TabRouteName = keyof typeof ICONS;

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;

  const OUTER_H = isTinyH ? 72 : isSmallH ? 76 : 80;
  const OUTER_PAD = isTinyH ? 5 : 6;
  const BORDER_W = 3;

  const BTN = isTinyH ? 52 : isSmallH ? 54 : 56;
  const ICON = isTinyH ? 24 : 26;

  const AVATAR = isTinyH ? 28 : isSmallH ? 30 : 32;

  const [selectedCharacter, setSelectedCharacter] = React.useState<'empress' | 'emperor'>('empress');

  const readCharacter = React.useCallback(async () => {
    try {
      const v = await AsyncStorage.getItem(KEY_CHARACTER);
      if (v === 'empress' || v === 'emperor') setSelectedCharacter(v);
    } catch {}
  }, []);

  React.useEffect(() => {
    readCharacter();
    const unsub = navigation.addListener('state', readCharacter);
    return unsub;
  }, [navigation, readCharacter]);

  const avatarSource = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;

  const bottomBase = Math.max(insets.bottom, 10);
  const bottomOffset = Platform.OS === 'android' ? bottomBase + 20 : bottomBase;

  const OUTER_W = Math.min(520, width * 0.92);

  return (
    <View pointerEvents="box-none" style={[styles.barWrap, { paddingBottom: bottomOffset }]}>
      <View
        style={[
          styles.outline,
          {
            width: OUTER_W,
            height: OUTER_H,
            borderRadius: OUTER_H / 2,
            borderWidth: BORDER_W,
            padding: OUTER_PAD,
          },
        ]}
      >
        <View
          style={[
            styles.pill,
            {
              borderRadius: (OUTER_H - OUTER_PAD * 2) / 2,
              paddingHorizontal: isTinyH ? 8 : 10,
            },
          ]}
        >
          {state.routes.map((route: any, index: number) => {
            const name = route.name as TabRouteName;
            const isFocused = state.index === index;
            const isCharacterTab = name === 'ChangeCharacter';

            const onPress = async () => {
              await readCharacter();
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.item,
                  {
                    width: BTN,
                    height: BTN,
                    borderRadius: BTN / 2,
                  },
                  isFocused && styles.itemActive,
                  pressed && styles.itemPressed,
                ]}
                android_ripple={
                  Platform.OS === 'android'
                    ? { color: 'rgba(255,255,255,0.08)', borderless: false }
                    : undefined
                }
              >
                {isCharacterTab ? (
                  <View
                    style={[
                      styles.avatarRing,
                      {
                        width: AVATAR + 8,
                        height: AVATAR + 8,
                        borderRadius: (AVATAR + 8) / 2,
                      },
                      isFocused && styles.avatarRingActive,
                    ]}
                  >
                    <Image
                      source={avatarSource}
                      style={{
                        width: AVATAR,
                        height: AVATAR,
                        borderRadius: AVATAR / 2,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <Image
                    source={isFocused ? ICONS[name].on : ICONS[name].off}
                    style={{ width: ICON, height: ICON }}
                    resizeMode="contain"
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' } as ViewStyle,
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="HomeDailyTips" component={HomeDailyTipsScreen} />
      <Tab.Screen name="SavedNoData" component={SavedNoDataScreen} />
      <Tab.Screen name="Advisors" component={AdvisorsScreen} />
      <Tab.Screen name="Game" component={GameScreen} />
      <Tab.Screen name="Collection" component={CollectionScreen} />
      <Tab.Screen name="ChangeCharacter" component={ChangeCharacterScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },

  outline: {
    borderColor: '#F3D27A',
    backgroundColor: 'rgba(0,0,0,0.10)',
    overflow: 'hidden',
  },

  pill: {
    flex: 1,
    backgroundColor: '#4A0B0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  item: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C0707',
  },

  itemActive: {
    backgroundColor: '#5B0D0D',
    borderWidth: 2,
    borderColor: 'rgba(243,210,122,0.40)',
  },

  itemPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.98,
  },

  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  avatarRingActive: {
    borderColor: 'rgba(243,210,122,0.60)',
  },
});