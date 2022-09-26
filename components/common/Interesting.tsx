import React, { HTMLAttributes } from 'react';
import { cn } from './util';

const INTERESTING = [
  new URL('/media/interesting.webm', import.meta.url).toString(),
  new URL('/media/interesting.mp4', import.meta.url).toString(),
];

export default function Interesting({
  caption,
  className,
  ...props
}: { caption: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{ position: 'relative', width: '200px' }}
      {...props}
      className={cn(className, `no-invert`)}
    >
      <video
        className='bg-dark'
        autoPlay={true}
        height='150'
        loop={true}
        playsInline={true}
        preload='auto'
      >
        {INTERESTING.map(url => (
          <source
            key={url}
            src={url}
            type={`video/${url.replace(/.*\.|\?.*/g, '')}`}
          />
        ))}
      </video>
      <div
        style={{
          color: 'white',
          position: 'absolute',
          textAlign: 'center',
          textShadow: '.15em .15em .15em black',
          textTransform: 'uppercase',
          top: '.2em',
          width: '100%',
        }}
      >
        {caption}
      </div>
      <div
        style={{
          bottom: '.7em',
          color: 'white',
          position: 'absolute',
          textAlign: 'center',
          textShadow: '.15em .15em .15em black',
          textTransform: 'uppercase',
          width: '100%',
        }}
      >
        Very Interesting
      </div>
    </div>
  );
}
