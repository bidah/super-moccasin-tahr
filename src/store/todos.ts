import { useCallback, useMemo } from 'react';
import { createMMKV, useMMKVString } from 'react-native-mmkv';

export type Todo = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
};

export type Filter = 'all' | 'active' | 'done';

const storage = createMMKV({ id: 'todos' });
const KEY = 'todos.v1';

function parse(raw: string | undefined): Todo[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as Todo[]) : [];
  } catch {
    return [];
  }
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useTodos() {
  const [raw, setRaw] = useMMKVString(KEY, storage);
  const todos = useMemo(() => parse(raw), [raw]);

  const write = useCallback(
    (update: (prev: Todo[]) => Todo[]) => {
      setRaw(JSON.stringify(update(parse(storage.getString(KEY)))));
    },
    [setRaw],
  );

  const add = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      write((prev) => [{ id: makeId(), title: trimmed, done: false, createdAt: Date.now() }, ...prev]);
    },
    [write],
  );

  const toggle = useCallback(
    (id: string) => write((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    [write],
  );

  const remove = useCallback((id: string) => write((prev) => prev.filter((t) => t.id !== id)), [write]);

  const rename = useCallback(
    (id: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      write((prev) => prev.map((t) => (t.id === id ? { ...t, title: trimmed } : t)));
    },
    [write],
  );

  const clearDone = useCallback(() => write((prev) => prev.filter((t) => !t.done)), [write]);

  return { todos, add, toggle, remove, rename, clearDone };
}
