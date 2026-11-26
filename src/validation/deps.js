import { useRef } from 'react';

function sameItems(a, b) {
    return a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
}

export function useStableDeps(deps) {
    const ref = useRef(null);
    const items = deps ? [...deps] : [];

    if (!ref.current || !sameItems(ref.current.items, items)) {
        ref.current = { items };
    }
    ref.current.deps = deps;

    return ref.current;
}
