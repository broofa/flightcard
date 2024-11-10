import MOTORS from 'thrustcurve-db';
import { GRAVITY_ACC } from '/components/Cards/MotorAnalysis';
import { COLORS } from '/components/common/ColorChits';
import { randomId } from '/components/common/util';
import { motorDisplayName } from '/util/motor-util';
import type { iMotor, iRocket } from '../../types';

export const NAMES = [
  'Shirley Baker',
  'Tomas Wood',
  'Herbert Moran',
  'Lucy Johnson',
  'Patricia Maxwell',
  'Kent Ross',
  'Julie Valdez',
  'Patty Curry',
  'Shawna Watkins',
  'Lillian Webb',
  'Darren Reese',
  'Maggie Becker',
  'Krista Perez',
  'Sam Butler',
  'Natasha Gilbert',
  'Irving Campbell',
  'Adrienne Palmer',
  'Marianne Horton',
  'Woodrow Murphy',
  'Pearl Higgins',
  'Arlene Kennedy',
  'Nick Hamilton',
  'Wilson Garrett',
  'Domingo Riley',
  'Doyle Fuller',
  'Mathew Davidson',
  'Tricia Hansen',
  'Tamara Floyd',
  'Jack Klein',
  'Tommy Hampton',
  'Shelia Howard',
  'Johanna Owens',
  'Harvey Tucker',
  'Earl Lambert',
  'Cody Gutierrez',
  'Mildred Banks',
  'Desiree Glover',
  'Jared Arnold',
  'Maureen Bennett',
  'Rachael Summers',
  'Jon Walters',
  'Pauline Walsh',
  'Melvin Curtis',
  'Misty Gill',
  'Melody Holmes',
  'Brandi Pena',
  'Alvin Jensen',
  'Theodore Washington',
  'Laurie Fowler',
  'Lynn Gonzalez',
  'Nina Barton',
  'Jasmine Romero',
  'Armando Strickland',
  'Clarence Sparks',
  'Beatrice Hicks',
  'Barbara Bryan',
  'Yolanda Nunez',
  'Cesar Brewer',
  'Irvin Cohen',
  'Tracey Saunders',
  'Levi Buchanan',
  'Virgil Ortiz',
  'June Barnett',
  'Edna Sims',
  'Greg Wheeler',
  'Javier Medina',
  'Lyle Coleman',
  'Raul Guerrero',
  'Willard Bates',
  'Roman Farmer',
  'Norma Peterson',
  'Lillie Bush',
  'Lydia Little',
  'Edgar Bridges',
  'Cheryl Olson',
  'Stacey Burton',
  'Kenny Jimenez',
  'Genevieve Simpson',
  'Debbie Diaz',
  'Guy Murray',
  'Hannah Graham',
  'Marian Hawkins',
  'Arthur Perry',
  'Otis Mclaughlin',
  'Jenna Cooper',
  'Roberta Lynch',
  'Roderick Silva',
  'Brendan Harvey',
  'Constance Maldonado',
  'Franklin Ramos',
  'Adrian Meyer',
  'Fred Porter',
  'Jamie Hayes',
  'Pete Townsend',
  'Tanya Neal',
  'Ron French',
  'Yvonne Wilkins',
  'Jodi Brock',
];

const ROCKET_NAMES = [
  '220 Swift',
  '3 Bandits',
  'AGM-57X Heatseeker',
  'Alpha III',
  'Altimeter',
  'Apollo Little Joe II',
  'Apollo 11 Saturn V',
  'Argent',
  'Asteroid Hunter',
  'Astron Skydart II',
  'Astron Sprint XL',
  'Atomic Aqua',
  'Baby Bertha',
  'Bandito',
  'Banshee',
  'Big Bertha',
  'Big Daddy',
  'Black Diamond',
  'Black Hole',
  'Black Star Voyager',
  'Blast-off Blue',
  'Blenders',
  'Booster-55',
  'Booster-60',
  'Bull Pup 12D',
  'Centuri',
  'Chiller',
  'Chuter-Two',
  'Cobra',
  'Code Red',
  'Comanche-3',
  'Conquest',
  'Cosmic Interceptor',
  'Crossbow SST',
  'Crossfire ISX',
  'Curvilinear',
  'Dark Silver',
  'Dark Zero',
  'Dazzler',
  'Der Red Max',
  'Designer Special',
  'Dragonite',
  'Drifter',
  'Eggscaliber',
  'EPM-010',
  'Estes Jetliner',
  'Estes SLV',
  'Estes Shuttle',
  'Extreme 12',
  'Fat Jax',
  'Fig Plucker',
  'Finky Starts',
  'Firehawk',
  'Firebolt',
  'Firestreak SST',
  'Firestorm',
  'Flip Flyer',
  'Flutter-By',
  'Flying Colors',
  'Fractured',
  'Freefall',
  'Galaxy Gold',
  'Generic E2X',
  'Goblin',
  'Helios',
  'Hi-Flier',
  'Hi-Flier XL',
  'Honest John',
  'Hornet',
  'Humdinger',
  'Hyper Bat',
  'Hyper Dart',
  'Indicator',
  'Journey',
  'L.G.M. 0095',
  'LoadStar II',
  'Lynx',
  'Magician',
  'Majestic',
  'Mammoth',
  'Mega Der Red Max',
  'Mercury Redstone',
  'Metalizer',
  'Meteorite White',
  'Mini Blaster Air',
  'Mini Comanche-3',
  'Mini Fat Boy',
  'Mini Honest John',
  'Mini Max',
  'MIRV',
  'Mix-n-Match-50',
  'Mix-n-Match-55',
  'Mix-n-Match-60',
  'Mongoose',
  'Mosquito',
  'Nike Smoke',
  'Nike Smoke',
  'Nitro',
  'No. 2 Estes Sky Writer',
  'Nova',
  'Odyssey',
  'Orange Crush',
  'Outer-space Orange',
  'Partizon',
  'Phantom Blue',
  'Pheasant Plucker',
  'Phoenix Bird',
  'Photon Probe',
  'Plaster Man',
  'Power Patrol',
  'Prospector',
  'QCC Explorer',
  'Quinstar',
  'Red Flare',
  'Red Rider',
  'Rogue Voyager',
  'Rookie',
  'Satellite Silver',
  'Savage',
  'Scorpion',
  'Sequoia',
  'Shattered',
  'Tooting Shtar',
  'Show Stopper',
  'Shuttle Xpress',
  'Shining Wit',
  'Sizzler',
  'Sky Cruiser',
  'Sky Duster',
  'Sky Hawker',
  'Sky Shark',
  'Sky Twister',
  'Sky Warrior',
  'Solar Warrior',
  'Solaris',
  'Spectra',
  'Spirit',
  'Star Orbiter',
  'Star Trooper',
  'STM-012',
  'Super Neon',
  'Super Neon XL',
  'Supernova',
  'Taser Twin',
  'Trajector',
  'Tercel Boost Glider',
  'Top Shot',
  'U.S. Army Patriot M-104',
  'UP Aerospace SpaceLoft',
  'V2',
  'Vagabond',
  'Ventris',
  'Viking',
  'Whirlwind',
  'Wild Flyer',
  'Wizard',
  'Xarconian Cruiser',
  'Yankee',
  'Yellow Star',
  'Zinger',
  '40',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOTOR_SIZES = [
  // min/max impulse (MKS units)
  { name: 'A', min: 1.25, max: 2.5 },
  { name: 'B', min: 2.5, max: 5 },
  { name: 'C', min: 5, max: 10 },
  { name: 'D', min: 10, max: 20 },
  { name: 'E', min: 20, max: 40 },
  { name: 'F', min: 40, max: 80 },
  { name: 'G', min: 80, max: 160 },

  { name: 'H', min: 160, max: 320 },
  { name: 'I', min: 320, max: 640 },

  { name: 'J', min: 640, max: 1280 },
  { name: 'K', min: 1280, max: 2560 },
  { name: 'L', min: 2560, max: 5120 },

  { name: 'M', min: 5120, max: 10240 },
  { name: 'N', min: 10240, max: 20480 },
  { name: 'O', min: 20480, max: 40960 },
];

const ROCKET_VENDORS = ['Estes', 'Mad Cow', 'SBR', 'LOC', 'Dynasoar'];

export function frnd(min: number, max?: number): number {
  return max == null ? Math.random() * min : min + Math.random() * (max - min);
}

export function rnd(min: number, max?: number): number {
  return Math.floor(frnd(min, max));
}

export function rndItem<Type>(vals: Type[] | Set<Type>): Type {
  const arr = Array.isArray(vals) ? vals : Array.from(vals);

  return arr[rnd(arr.length)];
}

export function createRocket(): iRocket {
  const tcMotor = rndItem(MOTORS);

  // weight should be < thrust * 5, but we generate some underpowered rockets to
  // test thrust:weight ratio UI
  const mass = tcMotor.avgThrustN / frnd(2, frnd(4, 20)) / GRAVITY_ACC;

  const aspectRatio = frnd(frnd(5, 30), frnd(10, 40));
  const length = (mass * 2) ** (1 / 3);
  const diameter = (mass * 5) ** (1 / 3) / aspectRatio;

  const motor: iMotor = {
    id: randomId(),
    name: motorDisplayName(tcMotor),
    stage: 1,
    impulse: tcMotor.totImpulseNs,
    tcMotorId: tcMotor.motorId,
  };

  const delays = tcMotor.delays?.split(',');
  const delay = Number.parseInt(rndItem(delays ?? []));
  if (!Number.isNaN(delay)) motor.delay = delay;

  const color = [
    rndItem(COLORS),
    rndItem(COLORS),
    rndItem(COLORS),
    rndItem(COLORS),
  ]
    .slice(rnd(4))
    .join();

  const rocket: iRocket = {
    name: rndItem(ROCKET_NAMES),
    manufacturer: rndItem(ROCKET_VENDORS),
    color,
    diameter,
    length,
    mass,
    _motor: motor,
  };

  return rocket;
}
