import type { ImageSourcePropType } from 'react-native';

const ART = {
  adam: require('@/assets/images/mashle/AdamJobs.png'),
  kaldo: require('@/assets/images/mashle/KaldoGehenna.png'),
  orter: require('@/assets/images/mashle/OrterMadl.png'),
  ryoh: require('@/assets/images/mashle/RyohGrantz.png'),
  wahlberg: require('@/assets/images/mashle/WahlbergBaigan.png'),
  lance: require('@/assets/images/mashle/LanceCrown.png'),
  rayne: require('@/assets/images/mashle/RayneAmes.png'),
  doom: require('@/assets/images/mashle/Doom.png'),
  innocent_zero: require('@/assets/images/mashle/InnocentZero.png'),
  mash: require('@/assets/images/mashle/MashBurnedead.png'),
} as const;

export interface MageCharacterBadge {
  key: string;
  name: string;
  tagline: string;
  points: [string, string, string];
  image: ImageSourcePropType;
}

// Ordered from Level 01 (entry rank) to Level 10 (apex).
export const MAGE_CHARACTERS: MageCharacterBadge[] = [
  {
    key: 'adam',
    name: 'Adam Jobs',
    tagline: 'Magician of Legend',
    points: ['Feared across generations', 'Teacher of Wahlberg & Zero', 'Historic apex magician'],
    image: ART.adam,
  },
  {
    key: 'kaldo',
    name: 'Kaldo Gehenna',
    tagline: 'Stylish Visionary',
    points: ['Versatile combatant', 'Elite reflexes', 'Fan-favourite Visionary'],
    image: ART.kaldo,
  },
  {
    key: 'orter',
    name: 'Orter Mádl',
    tagline: 'Sand Tactician',
    points: ['Tactical genius', 'Sand defense control', 'Ruthless under pressure'],
    image: ART.orter,
  },
  {
    key: 'ryoh',
    name: 'Ryoh Grantz',
    tagline: 'Active Visionary',
    points: ['Devastating offensive magic', 'Top-active Visionary', 'Commands respect'],
    image: ART.ryoh,
  },
  {
    key: 'wahlberg',
    name: 'Wahlberg Baigan',
    tagline: 'Headmaster Mage',
    points: ['Spatial magic master', 'Challenged Innocent Zero', 'Legendary headmaster'],
    image: ART.wahlberg,
  },
  {
    key: 'lance',
    name: 'Lance Crown',
    tagline: 'Gravity Bearer',
    points: ['Gravity battlefield control', 'Massive growth arc', "Mash's strongest ally"],
    image: ART.lance,
  },
  {
    key: 'rayne',
    name: 'Rayne Ames',
    tagline: 'Divine Visionary',
    points: ['Terrifying summon magic', 'Calm tactical mind', 'Beloved elite'],
    image: ART.rayne,
  },
  {
    key: 'doom',
    name: 'Doom',
    tagline: 'Pure Muscle',
    points: ['Monstrous physical power', 'Overwhelming combat instinct', 'Pushed Mash to his limit'],
    image: ART.doom,
  },
  {
    key: 'innocent_zero',
    name: 'Innocent Zero',
    tagline: 'Final Antagonist',
    points: ['Time manipulation', 'Endless regeneration', 'Nearly ruled the world'],
    image: ART.innocent_zero,
  },
  {
    key: 'mash',
    name: 'Mash Burnedead',
    tagline: 'Muscle Realm Boss',
    points: ['Beats magic with raw power', 'Speed beyond reason', 'Series apex'],
    image: ART.mash,
  },
];

export const MAGE_CHARACTER_BY_KEY: Record<string, MageCharacterBadge> =
  MAGE_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c;
    return acc;
  }, {} as Record<string, MageCharacterBadge>);

// Backwards-compatible image lookup mirroring CHAKRA_BADGE_IMAGES.
export const MAGE_BADGE_IMAGES: Record<string, ImageSourcePropType> =
  MAGE_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c.image;
    return acc;
  }, {} as Record<string, ImageSourcePropType>);
