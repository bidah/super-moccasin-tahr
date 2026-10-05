import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import type { Todo } from '../store/todos';

type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, title: string) => void;
};

function TodoItemBase({ todo, onToggle, onRemove, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== todo.title) onRename(todo.id, draft);
    else setDraft(todo.title);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutLeft.duration(180)}
      layout={LinearTransition.springify().damping(18)}
      className="mx-4 mb-2 flex-row items-center rounded-2xl bg-white px-3 py-3 dark:bg-neutral-900"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.done }}
        accessibilityLabel={todo.done ? 'Mark as not done' : 'Mark as done'}
        hitSlop={8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(todo.id);
        }}
        className={`h-7 w-7 items-center justify-center rounded-full border-2 ${
          todo.done ? 'border-blue-500 bg-blue-500' : 'border-neutral-300 dark:border-neutral-600'
        }`}
      >
        {todo.done ? <Ionicons name="checkmark" size={16} color="white" /> : null}
      </Pressable>

      {editing ? (
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          returnKeyType="done"
          className="ml-3 flex-1 text-base text-black dark:text-white"
          style={{ paddingVertical: 0 }}
        />
      ) : (
        <Pressable
          className="ml-3 flex-1"
          onPress={() => onToggle(todo.id)}
          onLongPress={() => {
            Haptics.selectionAsync();
            setDraft(todo.title);
            setEditing(true);
          }}
          accessibilityHint="Tap to toggle, long press to edit"
        >
          <Text
            numberOfLines={3}
            className={`text-base ${
              todo.done ? 'text-neutral-400 line-through dark:text-neutral-500' : 'text-black dark:text-white'
            }`}
          >
            {todo.title}
          </Text>
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete"
        hitSlop={8}
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onRemove(todo.id);
        }}
        className="ml-2 h-8 w-8 items-center justify-center rounded-full active:bg-red-50 dark:active:bg-red-950"
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </Pressable>
    </Animated.View>
  );
}

export const TodoItem = memo(TodoItemBase);
