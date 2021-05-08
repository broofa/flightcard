import { iMotor, iRocket } from '../types';

export const NAMES = ['Shirley Baker', 'Tomas Wood', 'Herbert Moran', 'Lucy Johnson', 'Patricia Maxwell', 'Kent Ross', 'Julie Valdez', 'Patty Curry', 'Shawna Watkins', 'Lillian Webb', 'Darren Reese', 'Maggie Becker', 'Krista Perez', 'Sam Butler', 'Natasha Gilbert', 'Irving Campbell', 'Adrienne Palmer', 'Marianne Horton', 'Woodrow Murphy', 'Pearl Higgins', 'Arlene Kennedy', 'Nick Hamilton', 'Wilson Garrett', 'Domingo Riley', 'Doyle Fuller', 'Mathew Davidson', 'Tricia Hansen', 'Tamara Floyd', 'Jack Klein', 'Tommy Hampton', 'Shelia Howard', 'Johanna Owens', 'Harvey Tucker', 'Earl Lambert', 'Cody Gutierrez', 'Mildred Banks', 'Desiree Glover', 'Jared Arnold', 'Maureen Bennett', 'Rachael Summers', 'Jon Walters', 'Pauline Walsh', 'Melvin Curtis', 'Misty Gill', 'Melody Holmes', 'Brandi Pena', 'Alvin Jensen', 'Theodore Washington', 'Laurie Fowler', 'Lynn Gonzalez', 'Nina Barton', 'Jasmine Romero', 'Armando Strickland', 'Clarence Sparks', 'Beatrice Hicks', 'Barbara Bryan', 'Yolanda Nunez', 'Cesar Brewer', 'Irvin Cohen', 'Tracey Saunders', 'Levi Buchanan', 'Virgil Ortiz', 'June Barnett', 'Edna Sims', 'Greg Wheeler', 'Javier Medina', 'Lyle Coleman', 'Raul Guerrero', 'Willard Bates', 'Roman Farmer', 'Norma Peterson', 'Lillie Bush', 'Lydia Little', 'Edgar Bridges', 'Cheryl Olson', 'Stacey Burton', 'Kenny Jimenez', 'Genevieve Simpson', 'Debbie Diaz', 'Guy Murray', 'Hannah Graham', 'Marian Hawkins', 'Arthur Perry', 'Otis Mclaughlin', 'Jenna Cooper', 'Roberta Lynch', 'Roderick Silva', 'Brendan Harvey', 'Constance Maldonado', 'Franklin Ramos', 'Adrian Meyer', 'Fred Porter', 'Jamie Hayes', 'Pete Townsend', 'Tanya Neal', 'Ron French', 'Yvonne Wilkins', 'Jodi Brock'];

export const COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Cyan', 'Purple', 'White', 'Black', 'Brown', 'Magenta', 'Tan', 'Olive', 'Maroon', 'Navy', 'Aquamarine', 'Turquoise', 'Silver', 'Lime', 'Teal', 'Indigo', 'Violet', 'Pink', 'Gray'];

const ROCKET_NAMES = ['220 Swift', '3 Bandits', 'AGM-57X Heatseeker', 'Alpha', 'Alpha III', 'Altimeter', 'Apollo Little Joe II', 'Apollo 11 Saturn V', 'Argent', 'Ascender', 'Asteroid Hunter', 'Astron Skydart II', 'Astron Sprint XL', 'Athena', 'Atomic Aqua', 'Baby Bertha', 'Bandito', 'Banshee', 'Big Bertha', 'Big Daddy', 'Black Diamond', 'Black Hole', 'Black Star Voyager', 'Blast-off Blue', 'Blenders', 'Booster-55', 'Booster-60', 'Bull Pup 12D', 'Centuri', 'Chiller', 'Chuter-Two', 'Cobra', 'Code Red', 'Comanche-3', 'Conquest', 'Cosmic Interceptor', 'Crossbow SST', 'Crossfire ISX', 'Curvilinear', 'Dark Silver', 'Dark Zero', 'Dazzler', 'Der Red Max', 'Designer Special', 'Dragonite', 'Drifter', 'Eggscaliber', 'EPM-010', 'Estes Jetliner', 'Estes SLV', 'Estes Shuttle', 'Extreme 12', 'Fat Jax', 'Firehawk', 'Firebolt', 'Firestreak SST', 'Firestorm', 'Fletcher', 'Flip Flyer', 'Flutter-By', 'Flying Colors', 'Fractured', 'Freefall', 'Galaxy Gold', 'Generic E2X', 'Goblin', 'Helios', 'Hi-Flier', 'Hi-Flier XL', 'Honest John', 'Hornet', 'Humdinger', 'Hyper Bat', 'Hyper Dart', 'Indicator', 'Journey', 'L.G.M. 0095', 'LoadStar II', 'Lynx', 'Magician', 'Majestic', 'Mammoth', 'Mega Der Red Max', 'Mercury Redstone', 'Metalizer', 'Meteorite White', 'Mini Blaster Air', 'Mini Comanche-3', 'Mini Fat Boy', 'Mini Honest John', 'Mini Max', 'MIRV', 'Mix-n-Match-50', 'Mix-n-Match-55', 'Mix-n-Match-60', 'Mongoose', 'Mosquito', 'Nike Smoke', 'Nike Smoke', 'Nitro', 'No. 2 Estes Sky Writer', 'Nova', 'Odyssey', 'Orange Crush', 'Outer-space Orange', 'Partizon', 'Phantom Blue', 'Phoenix Bird', 'Photon Probe', 'Power Patrol', 'Prospector', 'Puma', 'QCC Explorer', 'Quinstar', 'Red Flare', 'Red Rider', 'Rogue Voyager', 'Rookie', 'Satellite Silver', 'Savage', 'Scorpion', 'Sequoia', 'Shattered', 'Shooting Star', 'Show Stopper', 'Shuttle Xpress', 'Sizzler', 'Sky Cruiser', 'Sky Duster', 'Sky Hawker', 'Sky Shark', 'Sky Twister', 'Sky Warrior', 'Solar Warrior', 'Solaris', 'Spectra', 'Spirit', 'Star Orbiter', 'Star Trooper', 'STM-012', 'Super Neon', 'Super Neon XL', 'Supernova', 'Taser Twin', 'Trajector', 'Tercel Boost Glider', 'Top Shot', 'U.S. Army Patriot M-104', 'UP Aerospace SpaceLoft', 'V2', 'Vagabond', 'Ventris', 'Viking', 'Whirlwind', 'Wild Flyer', 'Wizard', 'Xarconian Cruiser', 'Yankee', 'Yellow Star', 'Zinger', '40'];

const MOTOR_SIZES = [ // min/max impulse (MKS units)
  { name: '1/8A', min: 0.05, max: 0.3125 },
  { name: '1/4A', min: 0.3125, max: 0.625 },
  { name: '1/2A', min: 0.625, max: 1.25 },
  { name: 'A', min: 1.25, max: 2.5 },
  { name: 'B', min: 2.50, max: 5 },
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
  { name: 'O', min: 20480, max: 40960 }
];

export function frnd(min : number, max ?: number) : number {
  return (max == null)
    ? Math.random() * min
    : min + Math.random() * (max - min);
}

export function rnd(min : number, max ?: number) : number {
  return Math.floor(frnd(min, max));
}

export function rndItem<Type>(arr : Type[]) : Type {
  return arr[rnd(arr.length)];
}

export function createRocket() : iRocket & {_motor ?: iMotor} {
  const name = rndItem(ROCKET_NAMES);
  const manufacturer = rndItem(['Estes', 'Mad Cow', 'Binder', 'LOC', 'Dynasoar']);

  // "Build" rocket around randomly selected motor class
  // (Using MKS units)
  const category = rndItem(MOTOR_SIZES);
  const impulse = frnd(category.min, category.max);
  const burn = frnd(Math.pow(impulse, 0.25), Math.pow(impulse, 0.25));
  const thrust = impulse / burn;
  const delay = Math.pow(impulse, 1 / 2.5);
  const mass = thrust / frnd(5, 20); // "mass <= thrust / 5"
  const aspectRatio = frnd(10, 0);
  const length = Math.pow(mass, 1 / 3);
  const diameter = Math.pow(mass, 1 / 3) / aspectRatio * 20;

  let { name: motorName } = category;
  motorName = `${motorName}${thrust.toFixed(thrust < 1 ? 1 : 0)}`;
  if (delay <= 20) motorName = `${motorName}-${Math.ceil(delay)}`;

  const motor = {
    name: motorName,
    _impulse: impulse,
    _thrust: thrust,
    _burn: burn
  };

  const color = rndItem(COLORS);

  const rocket = {
    id: 1e7 + Math.floor(1e6 * Math.random()),
    name,
    manufacturer,
    color,
    diameter,
    length,
    mass,
    _motor: motor
  };

  return rocket;
}
