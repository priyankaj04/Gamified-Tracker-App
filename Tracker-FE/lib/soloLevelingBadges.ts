import type { ImageSourcePropType } from 'react-native';

const ART = {
  igris: require('@/assets/images/sololeveling/Igris.png'),
  cha: require('@/assets/images/sololeveling/ChaHaeIn.png'),
  gunhee: require('@/assets/images/sololeveling/GoGunhee.png'),
  liu: require('@/assets/images/sololeveling/LiuZhigang.png'),
  thomas: require('@/assets/images/sololeveling/ThomasAndre.png'),
  beru: require('@/assets/images/sololeveling/Beru.png'),
  bellion: require('@/assets/images/sololeveling/Bellion.png'),
  antares: require('@/assets/images/sololeveling/Antares.png'),
  ashborn: require('@/assets/images/sololeveling/Ashborn.png'),
  jinwoo: require('@/assets/images/sololeveling/SunJinwoo.png'),
} as const;

export interface SoloLevelingCharacterBadge {
  key: string;
  name: string;
  tagline: string;
  points: [string, string, string];
  image: ImageSourcePropType;
}

// Ordered from Level 01 (entry rank) to Level 10 (apex).
export const SOLO_LEVELING_CHARACTERS: SoloLevelingCharacterBadge[] = [
  {
    key: 'igris',
    name: 'Igris',
    tagline: 'Knight of Shadows',
    points: ['Elite knight shadow', 'Sword combat mastery', 'Iconic Jinwoo summon'],
    image: ART.igris,
  },
  {
    key: 'cha',
    name: 'Cha Hae-In',
    tagline: 'Korean S-Rank',
    points: ['Top female hunter', 'Exceptional swordwork', 'Fan-favourite role'],
    image: ART.cha,
  },
  {
    key: 'gunhee',
    name: 'Go Gunhee',
    tagline: 'Hidden Power',
    points: ["Ruler's vessel", 'Elder hunter legend', 'Extraordinary combat ability'],
    image: ART.gunhee,
  },
  {
    key: 'liu',
    name: 'Liu Zhigang',
    tagline: 'China National',
    points: ['Strongest in China', 'Overwhelming aura', 'Globally respected'],
    image: ART.liu,
  },
  {
    key: 'thomas',
    name: 'Thomas Andre',
    tagline: 'Goliath',
    points: ['Strongest US National', 'Massive raw power', 'Apex human defender'],
    image: ART.thomas,
  },
  {
    key: 'beru',
    name: 'Beru',
    tagline: 'Shadow General',
    points: ['Former Ant King', 'Speed + regen brutality', 'Fan-favourite shadow'],
    image: ART.beru,
  },
  {
    key: 'bellion',
    name: 'Bellion',
    tagline: 'Grand Marshal',
    points: ['Strongest shadow soldier', 'Ancient elite warrior', 'Dominates high-tier foes'],
    image: ART.bellion,
  },
  {
    key: 'antares',
    name: 'Antares',
    tagline: 'Dragon Monarch',
    points: ['Top Monarch besides Shadow', 'Catastrophic dragon power', "Jinwoo's hardest fight"],
    image: ART.antares,
  },
  {
    key: 'ashborn',
    name: 'Ashborn',
    tagline: 'Original Monarch',
    points: ["Source of Jinwoo's power", 'Feared by Rulers', 'Overwhelming destruction'],
    image: ART.ashborn,
  },
  {
    key: 'jinwoo',
    name: 'Sung Jinwoo',
    tagline: 'Shadow Monarch',
    points: ['Strongest Monarch alive', 'Unstoppable shadow army', 'Defeated god-tier beings'],
    image: ART.jinwoo,
  },
];

export const SOLO_LEVELING_CHARACTER_BY_KEY: Record<string, SoloLevelingCharacterBadge> =
  SOLO_LEVELING_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c;
    return acc;
  }, {} as Record<string, SoloLevelingCharacterBadge>);

export const SOLO_LEVELING_BADGE_IMAGES: Record<string, ImageSourcePropType> =
  SOLO_LEVELING_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c.image;
    return acc;
  }, {} as Record<string, ImageSourcePropType>);
