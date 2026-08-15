import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { InlineEmptyState } from '@/src/components/StateViews';
import { supportsNativeDragAndDrop } from '@/src/constants/platform';
import { FormField } from '@/src/components/ui/FormField';
import { colors, radii, spacing } from '@/src/constants/theme';
import { SAVE_DEBOUNCE_MS } from '@/src/constants/timing';
import {
  createTempTask,
  mergeSavedWithDrafts,
  shouldPersistTasks,
  tasksSnapshot,
  useSaveOutingLogTasks,
} from '@/src/hooks/useOutingLogTasks';
import type { OutingLogTask } from '@/src/types';
import { moveListItem } from '@/src/utils/reorderList';

interface OutingLogTasksProps {
  logDate: string;
  serverTasks?: OutingLogTask[];
  defaultTemplateId?: string | null;
}

export function OutingLogTasks({
  logDate,
  serverTasks,
  defaultTemplateId,
}: OutingLogTasksProps) {
  const saveTasks = useSaveOutingLogTasks();
  const [tasks, setTasks] = useState<OutingLogTask[]>([]);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const lastSavedSnapshot = useRef('');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHydrating = useRef(false);
  const isDirty = useRef(false);
  const isMounted = useRef(true);
  const loadedDate = useRef<string | null>(null);

  const applyServerTasks = useCallback((fromServer: OutingLogTask[]) => {
    isHydrating.current = true;
    lastSavedSnapshot.current = tasksSnapshot(fromServer);
    setTasks(fromServer);

    const frame = requestAnimationFrame(() => {
      isHydrating.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fromServer = serverTasks ?? [];
    const serverSnapshot = tasksSnapshot(fromServer);

    if (loadedDate.current !== logDate) {
      loadedDate.current = logDate;
      isDirty.current = false;
      return applyServerTasks(fromServer);
    }

    if (isDirty.current) return;

    if (serverSnapshot !== lastSavedSnapshot.current) {
      return applyServerTasks(fromServer);
    }
  }, [applyServerTasks, logDate, serverTasks]);

  const persist = useCallback(
    (nextTasks: OutingLogTask[]) => {
      if (!shouldPersistTasks(nextTasks, lastSavedSnapshot.current)) return;

      const savableTasks = nextTasks.filter((task) => task.title.trim().length > 0);
      const snapshot = tasksSnapshot(savableTasks);

      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      saveTimeout.current = setTimeout(async () => {
        if (!isMounted.current) return;
        if (!shouldPersistTasks(nextTasks, lastSavedSnapshot.current)) return;

        try {
          const saved = await saveTasks.mutateAsync({
            log_date: logDate,
            template_id: defaultTemplateId,
            tasks: savableTasks.map((task, index) => ({
              title: task.title,
              completed: task.completed,
              sort_order: index,
            })),
          });
          if (!isMounted.current) return;

          lastSavedSnapshot.current = tasksSnapshot(saved);
          isDirty.current = false;
          setTasks((current) => mergeSavedWithDrafts(saved, current));
          loadedDate.current = logDate;
        } catch (e) {
          Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save tasks');
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [defaultTemplateId, logDate, saveTasks]
  );

  const updateTasks = useCallback(
    (nextTasks: OutingLogTask[]) => {
      isDirty.current = true;
      setTasks(nextTasks);
      if (!isHydrating.current) {
        persist(nextTasks);
      }
    },
    [persist]
  );

  const addTask = () => {
    const task = createTempTask();
    setFocusTaskId(task.id);
    updateTasks([...tasks, task]);
  };

  const updateTask = (taskId: string, patch: Partial<Pick<OutingLogTask, 'title' | 'completed'>>) => {
    updateTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    );
  };

  const removeTask = (taskId: string) => {
    updateTasks(tasks.filter((task) => task.id !== taskId));
  };

  const moveTask = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateTasks(moveListItem(tasks, fromIndex, toIndex));
    },
    [tasks, updateTasks]
  );

  const renderTaskRow = (
    item: OutingLogTask,
    options: { drag?: () => void; isActive?: boolean; index?: number } = {}
  ) => {
    const { drag, isActive = false, index } = options;

    return (
      <View style={[styles.taskRow, isActive && styles.taskRowActive]}>
        {supportsNativeDragAndDrop && drag ? (
          <Pressable onLongPress={drag} delayLongPress={120} style={styles.dragHandle}>
            <Ionicons name="reorder-three" size={20} color={colors.textMuted} />
          </Pressable>
        ) : index !== undefined ? (
          <View style={styles.webReorderControls}>
            <Pressable
              onPress={() => moveTask(index, index - 1)}
              disabled={index === 0}
              style={[styles.webReorderBtn, index === 0 && styles.webReorderBtnDisabled]}>
              <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => moveTask(index, index + 1)}
              disabled={index === tasks.length - 1}
              style={[
                styles.webReorderBtn,
                index === tasks.length - 1 && styles.webReorderBtnDisabled,
              ]}>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}
        <Pressable
          onPress={() => updateTask(item.id, { completed: !item.completed })}
          hitSlop={8}
          style={styles.checkBtn}>
          <Ionicons
            name={item.completed ? 'checkbox' : 'square-outline'}
            size={22}
            color={item.completed ? colors.completed : colors.textSecondary}
          />
        </Pressable>
        <TextInput
          style={[styles.taskInput, item.completed && styles.taskInputCompleted]}
          value={item.title}
          onChangeText={(title) => updateTask(item.id, { title })}
          placeholder="Add a task..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          blurOnSubmit
          autoFocus={item.id === focusTaskId}
          onFocus={() => {
            if (item.id === focusTaskId) {
              setFocusTaskId(null);
            }
          }}
        />
        <Pressable onPress={() => removeTask(item.id)} hitSlop={8}>
          <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>
    );
  };

  const renderTask = ({ item, drag, isActive }: RenderItemParams<OutingLogTask>) => (
    <ScaleDecorator>{renderTaskRow(item, { drag, isActive })}</ScaleDecorator>
  );

  return (
    <FormField
      icon="checkbox-outline"
      title="Tasks"
      action={
        <View style={styles.headerActions}>
          {saveTasks.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null}
          <Pressable style={styles.addBtn} onPress={addTask} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
      }>
      {tasks.length === 0 ? (
        <InlineEmptyState
          icon="checkbox-outline"
          message="Add custom tasks for this outing."
          actionLabel="Add task"
          onAction={addTask}
          compact
        />
      ) : supportsNativeDragAndDrop ? (
        <DraggableFlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => updateTasks(data)}
          renderItem={renderTask}
          scrollEnabled={false}
          nestedScrollEnabled
          containerStyle={styles.taskList}
        />
      ) : (
        <View style={styles.taskList}>
          {tasks.map((item, index) => (
            <View key={item.id}>{renderTaskRow(item, { index })}</View>
          ))}
        </View>
      )}
    </FormField>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addBtn: {
    padding: 2,
  },
  taskList: {
    flexGrow: 0,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  taskRowActive: {
    borderColor: colors.primary,
  },
  dragHandle: {
    paddingVertical: 4,
  },
  webReorderControls: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  webReorderBtn: {
    padding: 2,
  },
  webReorderBtnDisabled: {
    opacity: 0.35,
  },
  checkBtn: {
    paddingVertical: 2,
  },
  taskInput: {
    flex: 1,
    height: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : {}),
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', lineHeight: '20px', margin: 0 } as object)
      : {}),
  },
  taskInputCompleted: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
