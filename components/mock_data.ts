import { iRocket } from '../types';

export const NAMES = ['Shirley Baker', 'Tomas Wood', 'Herbert Moran', 'Lucy Johnson', 'Patricia Maxwell', 'Kent Ross', 'Julie Valdez', 'Patty Curry', 'Shawna Watkins', 'Lillian Webb', 'Darren Reese', 'Maggie Becker', 'Krista Perez', 'Sam Butler', 'Natasha Gilbert', 'Irving Campbell', 'Adrienne Palmer', 'Marianne Horton', 'Woodrow Murphy', 'Pearl Higgins', 'Arlene Kennedy', 'Nick Hamilton', 'Wilson Garrett', 'Domingo Riley', 'Doyle Fuller', 'Mathew Davidson', 'Tricia Hansen', 'Tamara Floyd', 'Jack Klein', 'Tommy Hampton', 'Shelia Howard', 'Johanna Owens', 'Harvey Tucker', 'Earl Lambert', 'Cody Gutierrez', 'Mildred Banks', 'Desiree Glover', 'Jared Arnold', 'Maureen Bennett', 'Rachael Summers', 'Jon Walters', 'Pauline Walsh', 'Melvin Curtis', 'Misty Gill', 'Melody Holmes', 'Brandi Pena', 'Alvin Jensen', 'Theodore Washington', 'Laurie Fowler', 'Lynn Gonzalez', 'Nina Barton', 'Jasmine Romero', 'Armando Strickland', 'Clarence Sparks', 'Beatrice Hicks', 'Barbara Bryan', 'Yolanda Nunez', 'Cesar Brewer', 'Irvin Cohen', 'Tracey Saunders', 'Levi Buchanan', 'Virgil Ortiz', 'June Barnett', 'Edna Sims', 'Greg Wheeler', 'Javier Medina', 'Lyle Coleman', 'Raul Guerrero', 'Willard Bates', 'Roman Farmer', 'Norma Peterson', 'Lillie Bush', 'Lydia Little', 'Edgar Bridges', 'Cheryl Olson', 'Stacey Burton', 'Kenny Jimenez', 'Genevieve Simpson', 'Debbie Diaz', 'Guy Murray', 'Hannah Graham', 'Marian Hawkins', 'Arthur Perry', 'Otis Mclaughlin', 'Jenna Cooper', 'Roberta Lynch', 'Roderick Silva', 'Brendan Harvey', 'Constance Maldonado', 'Franklin Ramos', 'Adrian Meyer', 'Fred Porter', 'Jamie Hayes', 'Pete Townsend', 'Tanya Neal', 'Ron French', 'Yvonne Wilkins', 'Jodi Brock'];

export const COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Cyan', 'Purple', 'White', 'Black', 'Brown', 'Magenta', 'Tan', 'Olive', 'Maroon', 'Navy', 'Aquamarine', 'Turquoise', 'Silver', 'Lime', 'Teal', 'Indigo', 'Violet', 'Pink', 'Gray'];

const ROCKET_NAMES = ['220 Swift', '3 Bandits', 'AGM-57X Heatseeker', 'Alpha', 'Alpha III', 'Altimeter', 'Apollo Little Joe II', 'Apollo 11 Saturn V', 'Argent', 'Ascender', 'Asteroid Hunter', 'Astron Skydart II', 'Astron Sprint XL', 'Athena', 'Atomic Aqua', 'Baby Bertha', 'Bandito', 'Banshee', 'Big Bertha', 'Big Daddy', 'Black Diamond', 'Black Hole', 'Black Star Voyager', 'Blast-off Blue', 'Blenders', 'Booster-55', 'Booster-60', 'Bull Pup 12D', 'Centuri', 'Chiller', 'Chuter-Two', 'Cobra', 'Code Red', 'Comanche-3', 'Conquest', 'Cosmic Interceptor', 'Crossbow SST', 'Crossfire ISX', 'Curvilinear', 'Dark Silver', 'Dark Zero', 'Dazzler', 'Der Red Max', 'Designer Special', 'Dragonite', 'Drifter', 'Eggscaliber', 'EPM-010', 'Estes Jetliner', 'Estes SLV', 'Estes Shuttle', 'Extreme 12', 'Fat Jax', 'Firehawk', 'Firebolt', 'Firestreak SST', 'Firestorm', 'Fletcher', 'Flip Flyer', 'Flutter-By', 'Flying Colors', 'Fractured', 'Freefall', 'Galaxy Gold', 'Generic E2X', 'Goblin', 'Helios', 'Hi-Flier', 'Hi-Flier XL', 'Honest John', 'Hornet', 'Humdinger', 'Hyper Bat', 'Hyper Dart', 'Indicator', 'Journey', 'L.G.M. 0095', 'LoadStar II', 'Lynx', 'Magician', 'Majestic', 'Mammoth', 'Mega Der Red Max', 'Mercury Redstone', 'Metalizer', 'Meteorite White', 'Mini Blaster Air', 'Mini Comanche-3', 'Mini Fat Boy', 'Mini Honest John', 'Mini Max', 'MIRV', 'Mix-n-Match-50', 'Mix-n-Match-55', 'Mix-n-Match-60', 'Mongoose', 'Mosquito', 'Nike Smoke', 'Nike Smoke', 'Nitro', 'No. 2 Estes Sky Writer', 'Nova', 'Odyssey', 'Orange Crush', 'Outer-space Orange', 'Partizon', 'Phantom Blue', 'Phoenix Bird', 'Photon Probe', 'Power Patrol', 'Prospector', 'Puma', 'QCC Explorer', 'Quinstar', 'Red Flare', 'Red Rider', 'Rogue Voyager', 'Rookie', 'Satellite Silver', 'Savage', 'Scorpion', 'Sequoia', 'Shattered', 'Shootig Star', 'Show Stopper', 'Shuttle Xpress', 'Sizzler', 'Sky Cruiser', 'Sky Duster', 'Sky Hawker', 'Sky Shark', 'Sky Twister', 'Sky Warrior', 'Solar Warrior', 'Solaris', 'Spectra', 'Spirit', 'Star Orbiter', 'Star Trooper', 'STM-012', 'Super Neon', 'Super Neon XL', 'Supernova', 'Taser Twin', 'Trajector', 'Tercel Boost Glider', 'Top Shot', 'U.S. Army Patriot M-104', 'UP Aerospace SpaceLoft', 'V2', 'Vagabond', 'Ventris', 'Viking', 'Whirlwind', 'Wild Flyer', 'Wizard', 'Xarconian Cruiser', 'Yankee', 'Yellow Star', 'Zinger', '40'];

const MOTORS = 'ABCDEFGHIJKLMNO'.split('');

export function rnd(n : number) : number {
  return Math.floor(Math.random() * n) as number;
}

export function rndItem<Type>(arr : Type[]) : Type {
  return arr[rnd(arr.length)];
}

export function createRocket() : iRocket {
  const name = rndItem(ROCKET_NAMES);
  const manufacturer = rndItem(['Estes', 'Mad Cow', 'Binder', 'LOC', 'Dynasoar']);
  const mClass = Math.floor(Math.random() ** 2 * MOTORS.length);

  const mRnd = () => (0.2 + 0.8 * Math.random()) * (1 + mClass);

  const _mImpulse = 0.3125 * Math.pow(2, mClass + Math.random()); // n-s
  const _mBurn = mRnd() / 4;
  const _mThrust = _mImpulse / _mBurn;

  const aspect = 6 + rnd(34); // cm
  const length = mRnd() * 30; // cm
  const diameter = length / aspect;
  const weight = Math.random() * diameter * length; // kg

  const motor = `${MOTORS[mClass]}${Math.round(_mThrust)}`;
  const color = rndItem(COLORS);

  const rocket = {
    id: 1e7 + Math.floor(1e6 * Math.random()),
    name,
    manufacturer,
    color,
    diameter: Math.round(diameter),
    length: Math.round(length),
    weight: Math.round(weight),
    motor,
    _mImpulse,
    _mBurn,
    _mThrust
  };

  return rocket;
}
