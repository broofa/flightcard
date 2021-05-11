import { useEffect, useState } from 'react';

/**
 * Factory function for creating React shared-state hooks.
 *
 * If you want to share some state across components and `props` propagation
 * or "Context" isn't cutting it, then this is probably what you're after.  A
 * simple, easy, way to share common state across any number of components.
 *
 * # Example
 *
 *   // In "app.js" (or wherever) create the hook, passing an initial value
 *   export const useFoo = sharedStateHook('hello');
 *
 *   // Import hook
 *   import {useFoo} from 'app.js';
 *
 *   function SomeComponent(props) {
 *     // Use hook as you would `useState()` (sans the initial value)
 *     const [foo, setFoo] = usefoo();
 *
 *     // `foo` is shared by all components that use this hook
 *     // `setFoo` sets `foo` for all components that use this hook
 *     ...
 *   }
 *
 * # ... but why not React Context?
 *
 * 1. The Provider / Consumer model doesn't easily accomodate components that both
 *    provide and consume.
 * 2. Contexts require coercing state into the React DOM, which isn't always
 *    convenient.
 * 3. Contexts push developers toward a model where the context is a single "catchall"
 *    Object that holds many, largely unrelated, properties.  This leads to components
 *    that depend on just one of the properties in a context, but that rerender when
 *    *any* property is changed.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function<T>(value : T, name ?: string /* for debugging */) {
  const setters = new Set<() => void>();

  return function useSharedState() : [T, (v : T) => void] {
    const [val, setVal] = useState<T>(value);

    useEffect(() => {
      setters.add(setVal as any);
      return () => (setters.delete(setVal as any) as unknown as void);
    }, []);

    return [val, (v : T) => {
      value = v;
      for (const setter of setters as any) setter(value);
    }];
  };
}
