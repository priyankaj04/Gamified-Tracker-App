import type { ImageSourcePropType } from 'react-native';

const ART = {
  silva: require('@/assets/images/hunterxhunter/SilvaZoldyck.png'),
  youpi: require('@/assets/images/hunterxhunter/Youpi.png'),
  kurapika: require('@/assets/images/hunterxhunter/Kurapika.png'),
  hisoka: require('@/assets/images/hunterxhunter/HisokaMorow.png'),
  chrollo: require('@/assets/images/hunterxhunter/ChrolloLucilfer.png'),
  pitou: require('@/assets/images/hunterxhunter/Neferpitou.png'),
  killua: require('@/assets/images/hunterxhunter/KilluaZoldyck.png'),
  gon: require('@/assets/images/hunterxhunter/GonFreecss.png'),
  netero: require('@/assets/images/hunterxhunter/IsaacNetero.png'),
  meruem: require('@/assets/images/hunterxhunter/45.png'),
} as const;

export interface HunterCharacterBadge {
  key: string;
  name: string;
  tagline: string;
  points: [string, string, string];
  image: ImageSourcePropType;
}

// Ordered from Level 01 (entry rank) to Level 10 (apex).
export const HUNTER_CHARACTERS: HunterCharacterBadge[] = [
  {
    key: 'silva',
    name: 'Silva Zoldyck',
    tagline: 'Zoldyck Patriarch',
    points: ['Head of the assassin clan', 'Nen-enhanced raw power', 'Battles Phantom Troupe'],
    image: ART.silva,
  },
  {
    key: 'youpi',
    name: 'Menthuthuyoupi',
    tagline: 'Royal Guard',
    points: ['Monstrous durability', 'Mid-combat evolution', 'Near unstoppable'],
    image: ART.youpi,
  },
  {
    key: 'kurapika',
    name: 'Kurapika',
    tagline: 'Chain User',
    points: ['Scarlet Eyes boost', 'Chain Jail vs Troupe', 'Tactical genius'],
    image: ART.kurapika,
  },
  {
    key: 'hisoka',
    name: 'Hisoka Morow',
    tagline: 'Magician',
    points: ['Bungee Gum mastery', 'Hunts strong prey', 'Iconic antagonist'],
    image: ART.hisoka,
  },
  {
    key: 'chrollo',
    name: 'Chrollo Lucilfer',
    tagline: 'Troupe Leader',
    points: ['Skill Hunter steal', 'Phantom Troupe boss', 'Master strategist'],
    image: ART.chrollo,
  },
  {
    key: 'pitou',
    name: 'Neferpitou',
    tagline: 'Royal Guard',
    points: ['Terror Nen aura', 'Lethal speed + healing', "King's first guard"],
    image: ART.pitou,
  },
  {
    key: 'killua',
    name: 'Killua Zoldyck',
    tagline: 'Godspeed',
    points: ['Series-fastest Nen', 'Zoldyck assassin prodigy', 'Fan-favourite'],
    image: ART.killua,
  },
  {
    key: 'gon',
    name: 'Gon Freecss',
    tagline: 'Adult Gon',
    points: ['Monstrous transformation', 'Limitless potential', 'Iconic protagonist'],
    image: ART.gon,
  },
  {
    key: 'netero',
    name: 'Isaac Netero',
    tagline: 'Hunter Chairman',
    points: ['100-Type Bodhisattva', 'Pushed Meruem', 'Legendary speed'],
    image: ART.netero,
  },
  {
    key: 'meruem',
    name: 'Meruem',
    tagline: 'Chimera Ant King',
    points: ['Apex Nen + intellect', 'Adapts mid-battle', 'Survived Rose nuke'],
    image: ART.meruem,
  },
];

export const HUNTER_CHARACTER_BY_KEY: Record<string, HunterCharacterBadge> =
  HUNTER_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c;
    return acc;
  }, {} as Record<string, HunterCharacterBadge>);

// Backwards-compatible image lookup.
export const HUNTER_BADGE_IMAGES: Record<string, ImageSourcePropType> =
  HUNTER_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c.image;
    return acc;
  }, {} as Record<string, ImageSourcePropType>);
