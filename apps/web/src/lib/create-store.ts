import { useCallback, useRef, useSyncExternalStore } from "react";

type Listener<T> = (state: T) => void;
type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

type StateCreator<T> = (set: SetState<T>, get: () => T) => T;

function identity<T>(value: T) {
  return value;
}

export type UseStore<T> = {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState: () => T;
  setState: SetState<T>;
  subscribe: (listener: Listener<T>) => () => void;
  persist?: {
    hasHydrated: () => boolean;
    onFinishHydration: (cb: () => void) => () => void;
  };
};

function createStoreImpl<T extends object>(createState: StateCreator<T>): UseStore<T> {
  let state: T;
  const listeners = new Set<Listener<T>>();

  const getState = () => state;
  const setState: SetState<T> = (partial) => {
    const nextPartial = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...nextPartial };
    listeners.forEach((listener) => listener(state));
  };
  const subscribe = (listener: Listener<T>) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  state = createState(setState, getState);

  function useStore(): T;
  function useStore<U>(selector: (state: T) => U): U;
  function useStore<U>(selector?: (state: T) => U): T | U {
    const sel = (selector ?? identity) as (state: T) => U;
    const selectorRef = useRef(sel);
    // oxlint-disable-next-line react/refs -- selector identity for useSyncExternalStore
    selectorRef.current = sel;

    const getSnapshot = useCallback(
      // oxlint-disable-next-line react/refs -- read latest selector in store snapshot
      () => selectorRef.current(getState()),
      [],
    );

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore as UseStore<T>;
}

/** Zustand-compatible: `createStore<T>()(fn)` or `createStore<T>(fn)`. */
export function createStore<T extends object>(): (createState: StateCreator<T>) => UseStore<T>;
export function createStore<T extends object>(createState: StateCreator<T>): UseStore<T>;
export function createStore<T extends object>(createState?: StateCreator<T>) {
  if (!createState) {
    return (cs: StateCreator<T>) => createStoreImpl(cs);
  }
  return createStoreImpl(createState);
}
