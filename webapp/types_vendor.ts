// Turn off VSCode warnings for modules w/out type definitions
declare module 'react-router-bootstrap';

// Tell VSCode not to choke on Parcel's static file imports.
// REF: https://github.com/parcel-bundler/parcel/issues/1445
declare module '*.png';
declare module '*.svg';
declare module '*.webp';
declare module '*.gif';
declare module '*.jpg';

// Tell TS about Parcel support for CSS modules.
//
// https://github.com/parcel-bundler/parcel/issues/7231#issuecomment-1012278424
declare module '*.module.scss' {
  const value: Record<string, string>;
  export default value;
}
