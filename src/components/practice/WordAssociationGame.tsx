import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ConversationSparkScenarioCard } from '@/src/components/practice/ConversationSparkScenarioCard';
import { SparkModeGuide, SparkProgress } from '@/src/components/practice/SparkModeGuide';
import { IconButton } from '@/src/components/ui/IconButton';
import { NumberInput } from '@/src/components/ui/NumberInput';
import {
  DEFAULT_CHAIN_WORD_GOAL,
  getDefaultWordGoalForMode,
  MAX_WORD_GOAL,
  MIN_WORD_GOAL,
  WORD_ASSOCIATION_MODE_CONFIG,
  WORD_ASSOCIATION_SPRINT_SECONDS,
  type WordAssociationMode,
} from '@/src/constants/wordAssociationWords';
import { formStyles } from '@/src/constants/form';
import { colors, radii, spacing } from '@/src/constants/theme';
import {
  generateSparkCompletion,
  generateSparkScenario,
  isSparkAiConfigured,
} from '@/src/services/conversationSpark';
import { resolveSeedWord } from '@/src/services/wordAssociationSeeds';
import type {
  ConversationSparkCompletion,
  ConversationSparkScenario,
} from '@/src/types/conversationSpark';
import {
  normalizeAssociationWord,
} from '@/src/utils/wordAssociation';

type SessionPhase = 'setup' | 'playing' | 'complete';

function clampWordGoal(value: number): number {
  return Math.min(MAX_WORD_GOAL, Math.max(MIN_WORD_GOAL, value));
}

function parseWordGoalInput(value: string, mode: WordAssociationMode): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return getDefaultWordGoalForMode(mode);
  return clampWordGoal(parsed);
}

function selectMode(
  option: WordAssociationMode,
  setSelectedMode: (mode: WordAssociationMode) => void,
  setWordGoalInput: (value: string) => void
) {
  setSelectedMode(option);
  const wordGoal = WORD_ASSOCIATION_MODE_CONFIG[option].wordGoal;
  if (wordGoal) {
    setWordGoalInput(String(wordGoal.defaultValue));
  }
}

export function WordAssociationGame() {
  const [phase, setPhase] = useState<SessionPhase>('setup');
  const [selectedMode, setSelectedMode] = useState<WordAssociationMode>('chain');
  const [wordGoalInput, setWordGoalInput] = useState(String(DEFAULT_CHAIN_WORD_GOAL));
  const [mode, setMode] = useState<WordAssociationMode>('chain');
  const [wordGoal, setWordGoal] = useState(DEFAULT_CHAIN_WORD_GOAL);
  const [chain, setChain] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [recentSeeds, setRecentSeeds] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(WORD_ASSOCIATION_SPRINT_SECONDS);
  const [sprintActive, setSprintActive] = useState(false);
  const [sparkScenario, setSparkScenario] = useState<ConversationSparkScenario | null>(null);
  const [sparkCompletion, setSparkCompletion] = useState<ConversationSparkCompletion | null>(null);
  const [sparkLoading, setSparkLoading] = useState(false);
  const [sparkCompletionLoading, setSparkCompletionLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const currentWord = chain[chain.length - 1] ?? '';
  const linkCount = Math.max(chain.length - 1, 0);
  const wordCount = chain.length;
  const modeConfig = WORD_ASSOCIATION_MODE_CONFIG[selectedMode];
  const playingModeConfig = WORD_ASSOCIATION_MODE_CONFIG[mode];
  const activeWordGoalConfig = playingModeConfig.wordGoal;
  const showWordGoalProgress = activeWordGoalConfig != null;
  const goalReached = showWordGoalProgress && wordCount >= wordGoal;

  const resetToSeed = useCallback((seed: string) => {
    setChain([seed]);
    setDraft('');
    setRecentSeeds((prev) => [seed, ...prev.filter((word) => word !== seed)].slice(0, 8));
  }, []);

  const startSession = useCallback(async () => {
    const modeWordGoal = WORD_ASSOCIATION_MODE_CONFIG[selectedMode].wordGoal;
    const nextGoal = modeWordGoal
      ? parseWordGoalInput(wordGoalInput, selectedMode)
      : 0;

    setSparkCompletion(null);
    setSparkCompletionLoading(false);

    if (selectedMode === 'spark') {
      setSparkLoading(true);
      try {
        const scenario = await generateSparkScenario(recentSeeds);
        setSparkScenario(scenario);
        setWordGoal(nextGoal);
        setMode(selectedMode);
        resetToSeed(scenario.seedWord);
        setSprintActive(false);
        setPhase('playing');
      } finally {
        setSparkLoading(false);
      }
      return;
    }

    setSparkScenario(null);
    setSeedLoading(true);
    try {
      const seed = await resolveSeedWord(recentSeeds);
      setWordGoal(nextGoal);
      setMode(selectedMode);
      resetToSeed(seed);
      setSecondsLeft(
        WORD_ASSOCIATION_MODE_CONFIG[selectedMode].timeGoalSeconds ??
          WORD_ASSOCIATION_SPRINT_SECONDS
      );
      setSprintActive(selectedMode === 'sprint');
      setPhase('playing');

      if (selectedMode === 'sprint') {
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    } finally {
      setSeedLoading(false);
    }
  }, [recentSeeds, resetToSeed, selectedMode, wordGoalInput]);

  const returnToSetup = useCallback(() => {
    setPhase('setup');
    setChain([]);
    setDraft('');
    setSprintActive(false);
    setSecondsLeft(WORD_ASSOCIATION_SPRINT_SECONDS);
    setSparkScenario(null);
    setSparkCompletion(null);
    setSparkCompletionLoading(false);
  }, []);

  const loadNewSparkScenario = useCallback(async () => {
    setSparkLoading(true);
    try {
      const scenario = await generateSparkScenario(recentSeeds);
      setSparkScenario(scenario);
      resetToSeed(scenario.seedWord);
      setSparkCompletion(null);
    } finally {
      setSparkLoading(false);
    }
  }, [recentSeeds, resetToSeed]);

  const startNewSeed = useCallback(async () => {
    setSeedLoading(true);
    try {
      const seed = await resolveSeedWord(recentSeeds);
      resetToSeed(seed);
    } finally {
      setSeedLoading(false);
    }
  }, [recentSeeds, resetToSeed]);

  const addAssociation = useCallback(() => {
    const next = normalizeAssociationWord(draft);
    if (!next || phase !== 'playing') return;

    setChain((prev) => [...prev, next]);
    setDraft('');
    inputRef.current?.focus();
  }, [draft, phase]);

  const undoLast = useCallback(() => {
    setChain((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const stopSprint = useCallback(() => {
    setSprintActive(false);
    setPhase('complete');
  }, []);

  useEffect(() => {
    if (phase !== 'complete' || mode !== 'spark' || !sparkScenario || chain.length === 0) {
      return;
    }

    let cancelled = false;
    setSparkCompletionLoading(true);

    generateSparkCompletion(sparkScenario, chain)
      .then((completion) => {
        if (!cancelled) setSparkCompletion(completion);
      })
      .finally(() => {
        if (!cancelled) setSparkCompletionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chain, mode, phase, sparkScenario]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const wordGoalConfig = WORD_ASSOCIATION_MODE_CONFIG[mode].wordGoal;
    if (!wordGoalConfig?.autoComplete) return;
    if (chain.length >= wordGoal) {
      setPhase('complete');
      setSprintActive(false);
    }
  }, [chain.length, mode, phase, wordGoal]);

  useEffect(() => {
    if (!sprintActive || phase !== 'playing') return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSprintActive(false);
          setPhase('complete');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, sprintActive]);

  if (phase === 'setup') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={formStyles.screenContent}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>{modeConfig.title}</Text>
          <Text style={styles.introBody}>{modeConfig.body}</Text>
        </View>

        <View style={styles.setupSection}>
          <Text style={styles.setupLabel}>Mode</Text>
          <View style={styles.modeRow}>
            {(Object.keys(WORD_ASSOCIATION_MODE_CONFIG) as WordAssociationMode[]).map((option) => (
              <Pressable
                key={option}
                style={[styles.modeChip, selectedMode === option && styles.modeChipActive]}
                onPress={() => selectMode(option, setSelectedMode, setWordGoalInput)}>
                <Text
                  style={[
                    styles.modeChipText,
                    selectedMode === option && styles.modeChipTextActive,
                  ]}>
                  {WORD_ASSOCIATION_MODE_CONFIG[option].label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {modeConfig.wordGoal ? (
          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>Word goal</Text>
            <NumberInput
              value={wordGoalInput}
              onChangeText={setWordGoalInput}
              placeholder={String(modeConfig.wordGoal.defaultValue)}
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.setupHint}>{modeConfig.wordGoal.setupHint}</Text>
          </View>
        ) : modeConfig.timeGoalSeconds ? (
          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>Time goal</Text>
            <Text style={styles.setupStaticValue}>{modeConfig.timeGoalSeconds} seconds</Text>
            <Text style={styles.setupHint}>No word limit — link as many words as you can.</Text>
          </View>
        ) : null}

        {selectedMode === 'spark' ? (
          <>
            <SparkModeGuide phase="setup" />
            <Text style={styles.setupHint}>
              {isSparkAiConfigured()
                ? 'AI will generate a fresh scene each round.'
                : 'Using built-in scenes. Add EXPO_PUBLIC_SPARK_AI_API_KEY for AI-generated scenes.'}
            </Text>
          </>
        ) : null}

        <Pressable
          style={[styles.startBtn, (sparkLoading || seedLoading) && styles.startBtnDisabled]}
          onPress={() => void startSession()}
          disabled={sparkLoading || seedLoading}>
          {sparkLoading || seedLoading ? (
            <Text style={styles.startBtnText}>
              {selectedMode === 'spark' ? 'Loading scenario…' : 'Picking a word…'}
            </Text>
          ) : (
            <>
              <Ionicons name="play" size={18} color={colors.onPrimary} />
              <Text style={styles.startBtnText}>Start</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'complete') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={formStyles.screenContent}>
        {mode === 'spark' ? <SparkModeGuide phase="complete" /> : null}

        {sparkScenario ? (
          <ConversationSparkScenarioCard
            scenario={sparkScenario}
            startingWord={chain[0]}
            stepLabel="The scene you practiced"
          />
        ) : null}

        <View style={styles.completeCard}>
          <Ionicons
            name={mode === 'spark' ? 'mic-outline' : mode === 'sprint' ? 'checkmark-circle-outline' : 'checkmark-circle-outline'}
            size={28}
            color={colors.success}
          />
          <Text style={styles.completeTitle}>
            {mode === 'spark'
              ? 'Now say it out loud'
              : mode === 'sprint'
                ? 'Sprint complete'
                : 'Session paused'}
          </Text>
          <Text style={styles.completeBody}>
            {mode === 'spark'
              ? `You built a ${wordCount}-word path. Read each prompt below as if you are in the scene — not as an exercise narration.`
              : mode === 'sprint'
                ? `You linked ${linkCount} word${linkCount === 1 ? '' : 's'} in 60 seconds.`
                : `You reached ${wordCount} word${wordCount === 1 ? '' : 's'} in your chain.`}
          </Text>
        </View>

        {chain.length > 0 ? (
          <View style={styles.chainSection}>
            <Text style={styles.chainTitle}>
              {mode === 'spark' ? 'The path you built' : 'Your chain'}
            </Text>
            <Text style={styles.chainSubtitle}>
              {mode === 'spark'
                ? 'These are the words you linked — use them as stepping stones in your reply.'
                : `${linkCount} link${linkCount === 1 ? '' : 's'}`}
            </Text>
            <View style={styles.chainList}>
              {chain.map((word, index) => (
                <View key={`${word}-${index}`} style={styles.chainItemRow}>
                  {index > 0 ? (
                    <Ionicons name="arrow-down" size={14} color={colors.textMuted} />
                  ) : (
                    <Ionicons name="flag-outline" size={14} color={colors.primary} />
                  )}
                  <Text style={styles.chainWord}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {sparkCompletion?.bridgeSuggestion ? (
          <View style={styles.bridgeCard}>
            <Text style={styles.bridgeLabel}>Bridge</Text>
            <Text style={styles.bridgeText}>{sparkCompletion.bridgeSuggestion}</Text>
          </View>
        ) : null}

        {sparkCompletionLoading ? (
          <Text style={styles.loadingText}>Generating scene-specific prompts…</Text>
        ) : sparkCompletion && sparkCompletion.prompts.length > 0 ? (
          <View style={styles.sparkSection}>
            <Text style={styles.sparkTitle}>Step 3 · Speaking prompts</Text>
            <Text style={styles.sparkSectionHint}>Read each one aloud. Pause between them.</Text>
            {sparkCompletion.prompts.map((prompt, index) => (
              <View key={prompt} style={styles.sparkPrompt}>
                <View style={styles.sparkPromptNumberWrap}>
                  <Text style={styles.sparkPromptNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.sparkPromptText}>{prompt}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <IconButton icon="refresh-outline" label="Play again" onPress={() => void startSession()} variant="primary" />
          <IconButton icon="options-outline" label="Change setup" onPress={returnToSetup} variant="surface" />
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={formStyles.screenContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionMode}>{playingModeConfig.label}</Text>
          {mode === 'spark' ? null : showWordGoalProgress ? (
            <Text style={[styles.sessionProgress, goalReached && styles.sessionProgressDone]}>
              {wordCount}/{wordGoal} words
              {activeWordGoalConfig?.autoComplete ? '' : ' target'}
            </Text>
          ) : (
            <Text style={styles.sessionProgress}>{secondsLeft}s left</Text>
          )}
        </View>

        {mode === 'spark' ? (
          <>
            <SparkProgress wordCount={wordCount} wordGoal={wordGoal} />
            {sparkScenario ? (
              <ConversationSparkScenarioCard
                scenario={sparkScenario}
                startingWord={chain[0]}
              />
            ) : null}
            <View style={styles.sparkInputSection}>
              <Text style={styles.sparkStepLabel}>Step 2 · Add the next word</Text>
              <Text style={styles.sparkInputHelp}>
                {linkCount === 0
                  ? `Starting from "${currentWord}", type the next word that comes to mind in this scene — something you might think or say next.`
                  : `What word comes after "${currentWord}"? Keep it something that could plausibly come up in this conversation.`}
              </Text>
              <View style={styles.promptCard}>
                <Text style={styles.promptLabel}>Current word</Text>
                <Text style={styles.promptWord}>{currentWord}</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {mode === 'sprint' ? (
              <View style={styles.sprintBanner}>
                <View style={styles.sprintStat}>
                  <Text style={styles.sprintStatLabel}>Time</Text>
                  <Text style={styles.sprintStatValue}>{secondsLeft}s</Text>
                </View>
                <View style={styles.sprintStat}>
                  <Text style={styles.sprintStatLabel}>Links</Text>
                  <Text style={styles.sprintStatValue}>{linkCount}</Text>
                </View>
                <Pressable style={styles.sprintStopBtn} onPress={stopSprint}>
                  <Text style={styles.sprintStopText}>Finish</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.promptCard}>
              <Text style={styles.promptLabel}>Associate with</Text>
              <Text style={styles.promptWord}>{currentWord}</Text>
              {chain.length > 1 ? (
                <Text style={styles.promptHint}>
                  From seed: <Text style={styles.promptHintStrong}>{chain[0]}</Text>
                </Text>
              ) : null}
            </View>
          </>
        )}

        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={[formStyles.input, styles.input]}
            value={draft}
            onChangeText={setDraft}
            placeholder={
              mode === 'spark'
                ? linkCount === 0
                  ? `Word after "${currentWord}"…`
                  : `Comes after "${currentWord}"…`
                : 'Your association...'
            }
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={addAssociation}
            editable={mode !== 'sprint' || sprintActive}
          />
          <Pressable
            style={[styles.addBtn, !draft.trim() && styles.addBtnDisabled]}
            onPress={addAssociation}
            disabled={!draft.trim() || (mode === 'sprint' && !sprintActive)}>
            <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          {mode === 'spark' ? (
            <IconButton
              icon="sparkles-outline"
              label="New scenario"
              onPress={() => void loadNewSparkScenario()}
              variant="surface"
              disabled={sparkLoading}
            />
          ) : (
            <IconButton
              icon="refresh-outline"
              label={seedLoading ? 'Loading…' : 'New seed'}
              onPress={() => void startNewSeed()}
              variant="surface"
              disabled={seedLoading}
            />
          )}
          <IconButton
            icon="arrow-undo-outline"
            label="Undo"
            onPress={undoLast}
            variant="surface"
            disabled={chain.length <= 1}
          />
          {mode === 'chain' ? (
            <IconButton
              icon="checkmark-outline"
              label="Done"
              onPress={() => setPhase('complete')}
              variant="surface"
            />
          ) : null}
        </View>

        <View style={styles.chainSection}>
          <View style={styles.chainHeader}>
            <Text style={styles.chainTitle}>
              {mode === 'spark' ? 'Your path so far' : 'Your chain'}
            </Text>
            <Text style={styles.chainCount}>
              {mode === 'spark' ? `${wordCount} of ${wordGoal} words` : `${linkCount} links`}
            </Text>
          </View>
          {chain.length === 1 && mode === 'spark' ? (
            <Text style={styles.chainEmpty}>
              The first word is set. Add {wordGoal - 1} more above to finish.
            </Text>
          ) : chain.length === 1 ? (
            <Text style={styles.chainEmpty}>Add your first association above.</Text>
          ) : (
            <View style={styles.chainList}>
              {chain.map((word, index) => (
                <View key={`${word}-${index}`} style={styles.chainItemRow}>
                  {index > 0 ? (
                    <Ionicons name="arrow-down" size={14} color={colors.textMuted} />
                  ) : (
                    <Ionicons name="flag-outline" size={14} color={colors.primary} />
                  )}
                  <Text style={[styles.chainWord, index === chain.length - 1 && styles.chainWordActive]}>
                    {word}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  introCard: {
    backgroundColor: colors.accentSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  introBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  setupSection: {
    gap: spacing.sm,
  },
  setupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setupHint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  setupStaticValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
  },
  startBtnText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  startBtnDisabled: {
    opacity: 0.7,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bridgeCard: {
    backgroundColor: colors.accentSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  bridgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bridgeText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  sparkInputSection: {
    gap: spacing.sm,
  },
  sparkStepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sparkInputHelp: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modeChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  modeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeChipTextActive: {
    color: colors.primary,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionMode: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sessionProgress: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sessionProgressDone: {
    color: colors.success,
  },
  sprintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sprintStat: {
    flex: 1,
    gap: 2,
  },
  sprintStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sprintStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  sprintStopBtn: {
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sprintStopText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptWord: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  promptHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  promptHintStrong: {
    color: colors.primary,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.45,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chainSection: {
    gap: spacing.md,
  },
  chainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  chainSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  chainCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chainEmpty: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  chainList: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chainItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chainWord: {
    fontSize: 15,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  chainWordActive: {
    color: colors.text,
    fontWeight: '700',
  },
  completeCard: {
    backgroundColor: colors.successSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  completeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  completeBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sparkSection: {
    gap: spacing.sm,
  },
  sparkSectionHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  sparkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sparkPrompt: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sparkPromptNumberWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sparkPromptNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  sparkPromptText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
});
