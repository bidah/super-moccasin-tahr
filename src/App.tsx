import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodoItem } from './components/TodoItem';
import { type Filter, useTodos } from './store/todos';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'done', label: 'Done' },
];

function TodoScreen() {
  const insets = useSafeAreaInsets();
  const { todos, add, toggle, remove, rename, clearDone } = useTodos();
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.done);
    if (filter === 'done') return todos.filter((t) => t.done);
    return todos;
  }, [todos, filter]);

  const remaining = todos.filter((t) => !t.done).length;
  const doneCount = todos.length - remaining;
  const canAdd = text.trim().length > 0;

  const submit = () => {
    if (!canAdd) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    add(text);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-100 dark:bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top }} className="px-4 pb-3">
        <View className="mt-2 flex-row items-end justify-between">
          <Text className="text-4xl font-bold tracking-tight text-black dark:text-white">Todos</Text>
          <Text className="mb-1 text-sm text-neutral-500">
            {todos.length === 0
              ? 'Nothing yet'
              : remaining === 0
                ? 'All done 🎉'
                : `${remaining} left`}
          </Text>
        </View>

        <View className="mt-4 flex-row items-center rounded-2xl bg-white px-4 py-2 dark:bg-neutral-900">
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            placeholder="Add a task…"
            placeholderTextColor="#9ca3af"
            returnKeyType="done"
            blurOnSubmit={false}
            className="flex-1 py-2 text-base text-black dark:text-white"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add task"
            onPress={submit}
            disabled={!canAdd}
            className={`ml-2 h-9 w-9 items-center justify-center rounded-full ${
              canAdd ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-800'
            }`}
          >
            <Ionicons name="add" size={22} color={canAdd ? 'white' : '#9ca3af'} />
          </Pressable>
        </View>

        <View className="mt-3 flex-row items-center">
          <View className="flex-1 flex-row rounded-xl bg-neutral-200 p-1 dark:bg-neutral-900">
            {FILTERS.map((f) => {
              const active = f.key === filter;
              return (
                <Pressable
                  key={f.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFilter(f.key);
                  }}
                  className={`flex-1 items-center rounded-lg py-1.5 ${
                    active ? 'bg-white dark:bg-neutral-700' : ''
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      active ? 'text-black dark:text-white' : 'text-neutral-500'
                    }`}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {doneCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                clearDone();
              }}
              hitSlop={6}
              className="ml-3"
            >
              <Text className="text-sm font-medium text-blue-500">Clear done</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TodoItem todo={item} onToggle={toggle} onRemove={remove} onRename={rename} />
        )}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 pb-24">
            <Ionicons
              name={filter === 'done' ? 'checkmark-done-circle-outline' : 'list-outline'}
              size={48}
              color="#a3a3a3"
            />
            <Text className="mt-3 text-center text-base text-neutral-500">
              {filter === 'all'
                ? 'No tasks yet. Add one above to get started.'
                : filter === 'active'
                  ? 'No active tasks. Nice work!'
                  : 'Nothing completed yet.'}
            </Text>
            <Text className="mt-1 text-center text-xs text-neutral-400">
              Tap to toggle · long press to edit
            </Text>
          </View>
        }
      />
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TodoScreen />
    </SafeAreaProvider>
  );
}
