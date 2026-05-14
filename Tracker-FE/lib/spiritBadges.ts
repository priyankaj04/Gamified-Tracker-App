import type { ImageSourcePropType } from 'react-native';

const ART = {
  shisui: require('@/assets/images/naruto/ShisuiUchiha.jpg'),
  sakura: require('@/assets/images/naruto/SakuraHarano.jpg'),
  gaara: require('@/assets/images/naruto/Gaara.jpg'),
  raikage3: require('@/assets/images/naruto/ThirdRaikage.jpg'),
  hiruzen: require('@/assets/images/naruto/HiruzenSarutobi.jpg'),
  killerb: require('@/assets/images/naruto/KillerB.jpg'),
  orochimaru: require('@/assets/images/naruto/Orochimaru.jpg'),
  jiraiya: require('@/assets/images/naruto/Jiraiya.jpg'),
  kabuto: require('@/assets/images/naruto/KabutoYakushi.jpg'),
  tobirama: require('@/assets/images/naruto/TobiramaSenju.jpg'),
  minato: require('@/assets/images/naruto/MinatoNamikaze.jpg'),
  nagato: require('@/assets/images/naruto/Nagato.jpg'),
  itachi: require('@/assets/images/naruto/ItachiUchiha.jpg'),
  kakashi: require('@/assets/images/naruto/KakashiHatake.jpg'),
  obito: require('@/assets/images/naruto/ObitoUchiha.jpg'),
  guy: require('@/assets/images/naruto/MightGuy.jpg'),
  hashirama: require('@/assets/images/naruto/HashiramaSenju.jpg'),
  madara: require('@/assets/images/naruto/MadaraUchiha.jpg'),
  sasuke: require('@/assets/images/naruto/SasukeUchiha.jpg'),
  naruto: require('@/assets/images/naruto/NarutoUzumaki.jpg'),
} as const;

export interface CharacterBadge {
  key: string;
  name: string;
  tagline: string;
  points: [string, string, string];
  image: ImageSourcePropType;
}

// Ordered from Level 01 (weakest entry rank) to Level 20 (apex).
export const SPIRIT_CHARACTERS: CharacterBadge[] = [
  {
    key: 'shisui',
    name: 'Shisui Uchiha',
    tagline: 'Shunshin no Shisui',
    points: ['Body Flicker speed', 'Kotoamatsukami genjutsu', 'Hyped legend'],
    image: ART.shisui,
  },
  {
    key: 'sakura',
    name: 'Sakura Haruno',
    tagline: 'Hundred Healings',
    points: ['Monster strength', 'Top medical-nin', 'Endurance fighter'],
    image: ART.sakura,
  },
  {
    key: 'gaara',
    name: 'Gaara of the Sand',
    tagline: 'Kazekage of the Wind',
    points: ['Absolute defense', 'Battlefield control', 'Underrated power'],
    image: ART.gaara,
  },
  {
    key: 'raikage3',
    name: 'Third Raikage',
    tagline: 'Unkillable Storm',
    points: ['Insane durability', 'One-vs-thousands', 'Hell Stab spear'],
    image: ART.raikage3,
  },
  {
    key: 'hiruzen',
    name: 'Hiruzen Sarutobi',
    tagline: 'The Professor',
    points: ['Mastered every jutsu', 'Prime God of Shinobi', 'Konoha guardian'],
    image: ART.hiruzen,
  },
  {
    key: 'killerb',
    name: 'Killer B',
    tagline: 'Perfect Jinchūriki',
    points: ['Eight-Tails control', 'Seven-sword style', 'Raw power'],
    image: ART.killerb,
  },
  {
    key: 'orochimaru',
    name: 'Orochimaru',
    tagline: 'The Snake Sannin',
    points: ['Hardest to kill', 'Forbidden jutsu master', 'Scientific genius'],
    image: ART.orochimaru,
  },
  {
    key: 'jiraiya',
    name: 'Jiraiya',
    tagline: 'Toad Sage',
    points: ['Legendary Sannin', 'Sage Mode brawler', 'Master mentor'],
    image: ART.jiraiya,
  },
  {
    key: 'kabuto',
    name: 'Kabuto Yakushi',
    tagline: 'Sage of Snakes',
    points: ['Near-perfect Sage Mode', 'Stacked kekkei genkai', 'Reanimation king'],
    image: ART.kabuto,
  },
  {
    key: 'tobirama',
    name: 'Tobirama Senju',
    tagline: 'The Second Hokage',
    points: ['Invented Flying Raijin', 'Edo Tensei creator', 'Elite tactician'],
    image: ART.tobirama,
  },
  {
    key: 'minato',
    name: 'Minato Namikaze',
    tagline: 'Yellow Flash',
    points: ['Fastest shinobi alive', 'Flying Raijin master', 'Rasengan creator'],
    image: ART.minato,
  },
  {
    key: 'nagato',
    name: 'Nagato',
    tagline: 'Wielder of Rinnegan',
    points: ['Six Paths of Pain', 'Planetary Devastation', 'One-man army'],
    image: ART.nagato,
  },
  {
    key: 'itachi',
    name: 'Itachi Uchiha',
    tagline: 'Sharingan Prodigy',
    points: ['Genjutsu genius', 'Totsuka + Yata combo', 'Susanoo dominator'],
    image: ART.itachi,
  },
  {
    key: 'kakashi',
    name: 'Kakashi Hatake',
    tagline: 'Copy Ninja',
    points: ['DMS god-tier prime', 'Kamui shuriken', 'Perfect Susanoo'],
    image: ART.kakashi,
  },
  {
    key: 'obito',
    name: 'Obito Uchiha',
    tagline: 'Ten-Tails Jinchūriki',
    points: ['Broken Kamui hax', 'Massive versatility', 'Tank-level durability'],
    image: ART.obito,
  },
  {
    key: 'guy',
    name: 'Might Guy',
    tagline: 'The Eighth Gate',
    points: ['Pure taijutsu beast', 'Nearly killed Madara', 'Highest physical feat'],
    image: ART.guy,
  },
  {
    key: 'hashirama',
    name: 'Hashirama Senju',
    tagline: 'God of Shinobi',
    points: ['Wood Style supremacy', 'Beat Madara + Kurama', 'Absurd healing'],
    image: ART.hashirama,
  },
  {
    key: 'madara',
    name: 'Madara Uchiha',
    tagline: 'Ten-Tails Sage',
    points: ['Limbo clones hax', 'Soloed the Alliance', 'Legendary Uchiha'],
    image: ART.madara,
  },
  {
    key: 'sasuke',
    name: 'Sasuke Uchiha',
    tagline: 'Rinnegan Heir',
    points: ['EMS + Rinnegan combo', 'Amenotejikara hax', 'Equal to Naruto'],
    image: ART.sasuke,
  },
  {
    key: 'naruto',
    name: 'Naruto Uzumaki',
    tagline: 'Seventh Hokage',
    points: ['Baryon Mode apex', 'Six Paths Sage Mode', 'Defeated god-tiers'],
    image: ART.naruto,
  },
];

export const SPIRIT_CHARACTER_BY_KEY: Record<string, CharacterBadge> =
  SPIRIT_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c;
    return acc;
  }, {} as Record<string, CharacterBadge>);

// Backwards-compatible image lookup used by older callers.
export const CHAKRA_BADGE_IMAGES: Record<string, ImageSourcePropType> =
  SPIRIT_CHARACTERS.reduce((acc, c) => {
    acc[c.key] = c.image;
    return acc;
  }, {} as Record<string, ImageSourcePropType>);
