import { type HTMLAttributes, useEffect, useRef } from 'react';
import { cn } from '../common/util';
import styles from './Flash.module.scss';

export function FlashItem({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;

    if (el) {
      el.style.height = `${el.scrollHeight}px`;
      el.ontransitionend = () => {
        el.style.height = 'auto';
      };
    }
  }, [ref]);

  return (
    <div className={cn(className, styles.flashItem)} ref={ref} {...props}>
      {children}
    </div>
  );
}
