import type { HTMLAttributes } from 'react';
import { cn } from '../common/util';
import * as styles from './Meme.module.scss';

export * as MEME_INTERESTING from '/media/memes/interesting_owl.webp';
export * as MEME_LAUGHING from '/media/memes/laughing_chimp.webp';
export * as MEME_SKEPTICAL from '/media/memes/skeptical_cat.webp';

export function Meme({
  meme,
  topText,
  bottomText,
  className,
  ...props
}: {
  meme: string;
  topText?: string;
  bottomText?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(styles.root, className)} {...props}>
      <img src={meme} />

      {topText ? (
        <div className={cn(styles.textTop, 'no-invert')}>{topText}</div>
      ) : null}
      {bottomText ? (
        <div className={cn(styles.textBottom, 'no-invert')}>{bottomText}</div>
      ) : null}
    </div>
  );
}
