import type { ImageSourcePropType } from 'react-native';

const ART = {
  reo: require('@/assets/images/bluelock/ReoMikage.png'),
  chigiri: require('@/assets/images/bluelock/HyomaChigiri.png'),
  bachira: require('@/assets/images/bluelock/MeguruBachira.png'),
  shidou: require('@/assets/images/bluelock/RyuseiShidou.png'),
  nagi: require('@/assets/images/bluelock/SeishiroNagi.png'),
  barou: require('@/assets/images/bluelock/ShoueiBarou.png'),
  sae: require('@/assets/images/bluelock/SaeItoshi.png'),
  kaiser: require('@/assets/images/bluelock/MichaelKaiser.png'),
  rin: require('@/assets/images/bluelock/RinItoshi.png'),
  isagi: require('@/assets/images/bluelock/YoichiIsagi.png'),
} as const;

export interface BlueLockCharacterBadge {
  key: string;
  name: string;
  tagline: string;
  points: [string, string, string];
  image: ImageSourcePropType;
}

// Ordered from Level 01 (entry rank) to Level 10 (apex).
export const BLUE_LOCK_CHARACTERS: BlueLockCharacterBadge[] = [
  {
    key: 'reo',
    name: 'Reo Mikage',
    tagline: 'Adaptive Playmaker',
    points: ['Copies opposing techniques', 'Versatile midfielder', 'Massive growth arc'],
    image: ART.reo,
  },
  {
    key: 'chigiri',
    name: 'Hyoma Chigiri',
    tagline: 'Speed Demon',
    points: ['Series-fastest striker', 'Breaks defensive lines', 'Conquered injury fears'],
    image: ART.chigiri,
  },
  {
    key: 'bachira',
    name: 'Meguru Bachira',
    tagline: 'Monster Dribbler',
    points: ['Elite dribbling instincts', 'Unpredictable playmaker', 'Fan-favourite flair'],
    image: ART.bachira,
  },
  {
    key: 'shidou',
    name: 'Ryusei Shidou',
    tagline: 'Chaos Striker',
    points: ['Most explosive in Lock', 'Impossible-goal genius', 'Pure athletic instinct'],
    image: ART.shidou,
  },
  {
    key: 'nagi',
    name: 'Seishiro Nagi',
    tagline: 'Natural Genius',
    points: ['Unreal ball control', 'Picks up skills instantly', 'Franchise icon'],
    image: ART.nagi,
  },
  {
    key: 'barou',
    name: 'Shouei Barou',
    tagline: 'The King',
    points: ['Predator Eye lethal', 'Dominant physicality', 'Powerful long shots'],
    image: ART.barou,
  },
  {
    key: 'sae',
    name: 'Sae Itoshi',
    tagline: 'World Midfielder',
    points: ['Recognised world-stage', 'Elite passing + dribble', 'Overwhelming football IQ'],
    image: ART.sae,
  },
  {
    key: 'kaiser',
    name: 'Michael Kaiser',
    tagline: 'Kaiser Impact',
    points: ['Deadliest shot in Lock', 'New Gen 11 striker', 'Arrogant icon'],
    image: ART.kaiser,
  },
  {
    key: 'rin',
    name: 'Rin Itoshi',
    tagline: 'Cold Genius',
    points: ['Most naturally gifted', 'Ruthless playmaker', 'Calm under pressure'],
    image: ART.rin,
  },
  {
    key: 'isagi',
    name: 'Yoichi Isagi',
    tagline: 'Meta Vision',
    points: ['Elite spatial awareness', 'Fastest evolution arc', 'Series protagonist'],
    image: ART.isagi,
  },
];

export const BLUE_LOCK_CHARACTER_BY_KEY: Record<string, BlueLockCharacterBadge> =
  BLUE_LOCK_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c;
    return acc;
  }, {} as Record<string, BlueLockCharacterBadge>);

// Backwards-compatible image lookup.
export const BLUE_LOCK_BADGE_IMAGES: Record<string, ImageSourcePropType> =
  BLUE_LOCK_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c.image;
    return acc;
  }, {} as Record<string, ImageSourcePropType>);
