export type BaseModel = {
  _type?: string;
  createdAt?: number;
  updatedAt?: number;
};

export type GPSLocation = {
  lat: number; // degrees latitude
  lon: number; // degrees longitude
  elevation?: number; // meters, AGL
};
