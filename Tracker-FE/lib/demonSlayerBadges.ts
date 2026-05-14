import type { ImageSourcePropType } from 'react-native';

const ART = {
  nezuko: require('@/assets/images/demonslayer/Nezuko.png'),
  tengen: require('@/assets/images/demonslayer/Tengen.png'),
  zenitsu: require('@/assets/images/demonslayer/Zenitsu.png'),
  rengoku: require('@/assets/images/demonslayer/Rengoku.png'),
  muichiro: require('@/assets/images/demonslayer/Muichiro.png'),
  obanai: require('@/assets/images/demonslayer/Obanai.png'),
  giyu: require('@/assets/images/demonslayer/Giyu.png'),
  sanemi: require('@/assets/images/demonslayer/Sanemi.png'),
  gyomei: require('@/assets/images/demonslayer/Gyomei.png'),
  akaza: require('@/assets/images/demonslayer/Akaza.png'),
  doma: require('@/assets/images/demonslayer/Doma.png'),
  tanjiro: require('@/assets/images/demonslayer/Tanjiro.png'),
  kokushibo: require('@/assets/images/demonslayer/Kokushibo.png'),
  muzan: require('@/assets/images/demonslayer/Muzan.png'),
  yoriichi: require('@/assets/images/demonslayer/Yoriichi.png'),
} as const;

export interface DemonSlayerCharacterBadge {
  key: string;
  name: string;
  tagline: string;
  points: [string, string, string];
  image: ImageSourcePropType;
}

// Ordered from Level 01 (entry rank) to Level 15 (apex).
export const DEMON_SLAYER_CHARACTERS: DemonSlayerCharacterBadge[] = [
  {
    key: 'nezuko',
    name: 'Nezuko Kamado',
    tagline: 'Sunlit Demon',
    points: ['Immune to sunlight', 'Powerful Blood Demon Art', 'Heart of the story'],
    image: ART.nezuko,
  },
  {
    key: 'tengen',
    name: 'Tengen Uzui',
    tagline: 'Sound Hashira',
    points: ['Ninja + Sound Breathing', 'Elite speed and strength', 'Flashiest Hashira'],
    image: ART.tengen,
  },
  {
    key: 'zenitsu',
    name: 'Zenitsu Agatsuma',
    tagline: 'Thunderclap',
    points: ['Series-fastest strikes', 'Created Seventh Form', 'Final-arc monster'],
    image: ART.zenitsu,
  },
  {
    key: 'rengoku',
    name: 'Kyojuro Rengoku',
    tagline: 'Flame Hashira',
    points: ['Burning fighting spirit', 'Nearly matched Akaza', 'Beloved icon'],
    image: ART.rengoku,
  },
  {
    key: 'muichiro',
    name: 'Muichiro Tokito',
    tagline: 'Mist Hashira',
    points: ['Youngest Hashira genius', 'Solo killed Upper Moon', 'Kokushibo bloodline'],
    image: ART.muichiro,
  },
  {
    key: 'obanai',
    name: 'Obanai Iguro',
    tagline: 'Serpent Hashira',
    points: ['Precise + fast strikes', 'Awakened Slayer Mark', 'Key final-battle role'],
    image: ART.obanai,
  },
  {
    key: 'giyu',
    name: 'Giyu Tomioka',
    tagline: 'Water Hashira',
    points: ['Water Breathing master', 'Calm efficient combat', 'Stood vs Akaza + Muzan'],
    image: ART.giyu,
  },
  {
    key: 'sanemi',
    name: 'Sanemi Shinazugawa',
    tagline: 'Wind Hashira',
    points: ['Aggressive swordsman', 'Rare demon-toxic blood', 'Survived Upper Moon fights'],
    image: ART.sanemi,
  },
  {
    key: 'gyomei',
    name: 'Gyomei Himejima',
    tagline: 'Stone Hashira',
    points: ['Strongest Hashira', 'Monstrous physicality', 'Cut down Kokushibo'],
    image: ART.gyomei,
  },
  {
    key: 'akaza',
    name: 'Akaza',
    tagline: 'Upper Moon 3',
    points: ['Martial-arts demon', 'Nearly unbeatable melee', 'Iconic antagonist'],
    image: ART.akaza,
  },
  {
    key: 'doma',
    name: 'Doma',
    tagline: 'Upper Moon 2',
    points: ['Ice Blood Demon Art', 'Clone + regen hax', 'Slayer killer'],
    image: ART.doma,
  },
  {
    key: 'tanjiro',
    name: 'Tanjiro Kamado',
    tagline: 'Sun Heir',
    points: ['Sun Breathing mastered', 'Awakened Slayer Mark', 'Fought Muzan directly'],
    image: ART.tanjiro,
  },
  {
    key: 'kokushibo',
    name: 'Kokushibo',
    tagline: 'Upper Moon 1',
    points: ['Strongest demon swordsman', 'Moon Breathing master', 'Stalled three Hashira'],
    image: ART.kokushibo,
  },
  {
    key: 'muzan',
    name: 'Muzan Kibutsuji',
    tagline: 'Demon King',
    points: ['Origin of all demons', 'Apex regeneration', 'Centuries-long reign'],
    image: ART.muzan,
  },
  {
    key: 'yoriichi',
    name: 'Yoriichi Tsugikuni',
    tagline: 'Sun Originator',
    points: ['Strongest in history', 'Created Sun Breathing', 'Permanently scarred Muzan'],
    image: ART.yoriichi,
  },
];

export const DEMON_SLAYER_CHARACTER_BY_KEY: Record<string, DemonSlayerCharacterBadge> =
  DEMON_SLAYER_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c;
    return acc;
  }, {} as Record<string, DemonSlayerCharacterBadge>);

export const DEMON_SLAYER_BADGE_IMAGES: Record<string, ImageSourcePropType> =
  DEMON_SLAYER_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c.image;
    return acc;
  }, {} as Record<string, ImageSourcePropType>);
