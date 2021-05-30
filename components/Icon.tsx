import React from 'react';
import { tProps } from './common/util';

/**
 * Icons from https://icons.getbootstrap.com/
 *
 * To add an icon, copy/paste the <path> element from the SVG source listed on the icons page.  (E.g. )
 */

export default function Icon({ name, size = '1em', color = 'currentColor', ...props } : {name : string, size ?: string, color ?: string} & tProps) {
  let path;
  switch (name) {
    case 'house-fill':
      path = <>
        <path fillRule='evenodd' d='m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6zm5-.793V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z'/>
        <path fillRule='evenodd' d='M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z'/>
      </>;
      break;

    case 'person-square':
      path = <>
        <path d='M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'/>
        <path d='M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1v-1c0-1-1-4-6-4s-6 3-6 4v1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12z'/>
      </>;
      break;

    case 'card-heading':
      path = <>
        <path d='M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z'/>
        <path d='M3 8.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0-5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1z'/>
      </>;
      break;

    case 'people':
      path = <>
        <path d='M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'/>
      </>;
      break;

    case 'rocket': // Custom icon, made with Inkscape
      path = <path d='M 16,0 C 14,0 13,1 12,2 L 6,8 H 3 l -2,2 h 3 l 2,2 v 3 L 8,13 V 10 L 14,4 C 15,3 16,2 16,0 Z M 2.972,10.5 C 2.851,10.5 2.737,10.555 2.65,10.642 L 1,12.287 c -0.193,0.192 -0.193,0.51 0,0.7 0.192,0.189 0.5,0.189 0.699,0 l 1.65,-1.645 c 0.193,-0.193 0.193,-0.51 0,-0.7 C 3.251,10.544 3.116,10.492 2.972,10.5 Z m 1.012,0.998 c -0.129,0 -0.249,0.055 -0.34,0.146 L 0.423,14.82 c -0.192,0.193 -0.192,0.5 0,0.7 0.193,0.189 0.5,0.189 0.7,0 l 3.232,-3.178 c 0.189,-0.193 0.189,-0.5 0,-0.699 C 4.276,11.565 4.162,11.513 4.044,11.5 4.026,11.5 4,11.5 3.988,11.5 Z m 0.986,0.998 c -0.011,0 -0.026,-0 -0.041,0 -0.1,0.011 -0.2,0.061 -0.287,0.136 l -1.644,1.657 c -0.193,0.192 -0.193,0.51 0,0.7 0.192,0.189 0.5,0.189 0.699,0 l 1.652,-1.649 c 0.193,-0.193 0.193,-0.51 0,-0.7 C 5.251,12.544 5.114,12.494 4.974,12.498 Z' />;
      break;

    case 'officer': // Custom icon (variant of person-check, made with Inkscape)
      path = <path d='m 13,2 0.77,2.32 2.22,-0.03 -1.86,1.49 0.71,2.21 -1.92,-1.4 -1.78,1.4 L 11.81,5.64 10,4.29 12.34,4.23 Z M 1,14 c 0,0 -1,0 -1,-1 0,-1 1,-4 6,-4 5,0 6,3 6,4 0,1 -1,1 -1,1 z M 6,8 C 10,8 10,2 6,2 2,2 2,8 6,8 Z' />;
      break;

    case 'gear-fill':
      path = <path d='M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z'/>
      ;
      break;
  }

  return <svg width={size} height={size} fill={color} viewBox='0 0 16 16' {...props}>{path}</svg>;
}
