import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
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

import {
  FearedFantasyGuide,
  FearedFantasyProgress,
} from '@/src/components/practice/FearedFantasyGuide';
import { IconButton } from '@/src/components/ui/IconButton';
import { formStyles } from '@/src/constants/form';
import {
  getResponseMethodConfig,
  JUDGMENT_STARTERS,
  MAX_JUDGMENTS,
  MIN_JUDGMENTS,
  RESPONSE_METHODS,
  type ResponseMethod,
} from '@/src/constants/fearedFantasy';
import { colors, radii, spacing } from '@/src/constants/theme';
import { suggestFearedJudgments } from '@/src/services/fearedFantasy';
import { isSparkAiConfigured } from '@/src/services/sparkAi';

type SessionPhase = 'setup' | 'judgments' | 'responding' | 'complete';

interface FearedFantasyEntry {
  judgment: string;
  method: ResponseMethod;
  response: string;
}

function normalizeJudgment(value: string): string {
  return value.trim().replace(/^["']|["']$/g, '');
}

export function FearedFantasyGame() {
  const [phase, setPhase] = useState<SessionPhase>('setup');
  const [fearedAction, setFearedAction] = useState('');
  const [judgments, setJudgments] = useState<string[]>([]);
  const [judgmentDraft, setJudgmentDraft] = useState('');
  const [entries, setEntries] = useState<FearedFantasyEntry[]>([]);
  const [responseIndex, setResponseIndex] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<ResponseMethod>('curiosity');
  const [responseDraft, setResponseDraft] = useState(getResponseMethodConfig('curiosity').example);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const trimmedAction = fearedAction.trim();
  const canStartJudgments = trimmedAction.length > 0;
  const canContinueToResponses = judgments.length >= MIN_JUDGMENTS;
  const currentJudgment = judgments[responseIndex] ?? '';
  const isLastResponse = responseIndex >= judgments.length - 1;

  const resetSession = useCallback(() => {
    setPhase('setup');
    setFearedAction('');
    setJudgments([]);
    setJudgmentDraft('');
    setEntries([]);
    setResponseIndex(0);
    setSelectedMethod('curiosity');
    setResponseDraft(getResponseMethodConfig('curiosity').example);
  }, []);

  const startJudgmentsPhase = useCallback(() => {
    if (!canStartJudgments) return;
    setPhase('judgments');
    setJudgments([]);
    setJudgmentDraft('');
    setEntries([]);
    setResponseIndex(0);
  }, [canStartJudgments]);

  const addJudgment = useCallback(
    (value: string) => {
      const next = normalizeJudgment(value);
      if (!next || judgments.length >= MAX_JUDGMENTS) return;
      if (judgments.some((entry) => entry.toLowerCase() === next.toLowerCase())) return;
      setJudgments((prev) => [...prev, next]);
      setJudgmentDraft('');
    },
    [judgments]
  );

  const removeJudgment = useCallback((index: number) => {
    setJudgments((prev) => prev.filter((_, entryIndex) => entryIndex !== index));
  }, []);

  const loadSuggestions = useCallback(async () => {
    if (!trimmedAction) return;
    setSuggestLoading(true);
    try {
      const suggestions = await suggestFearedJudgments(trimmedAction);
      setJudgments((prev) => {
        const merged = [...prev];
        for (const suggestion of suggestions) {
          if (merged.length >= MAX_JUDGMENTS) break;
          const normalized = normalizeJudgment(suggestion);
          if (!normalized) continue;
          if (merged.some((entry) => entry.toLowerCase() === normalized.toLowerCase())) continue;
          merged.push(normalized);
        }
        return merged;
      });
    } finally {
      setSuggestLoading(false);
    }
  }, [trimmedAction]);

  const beginResponses = useCallback(() => {
    if (!canContinueToResponses) return;
    setEntries([]);
    setResponseIndex(0);
    setSelectedMethod('curiosity');
    setResponseDraft(getResponseMethodConfig('curiosity').example);
    setPhase('responding');
  }, [canContinueToResponses]);

  const selectMethod = useCallback((method: ResponseMethod) => {
    setSelectedMethod(method);
    setResponseDraft(getResponseMethodConfig(method).example);
  }, []);

  const saveResponse = useCallback(() => {
    const response = responseDraft.trim();
    if (!response || !currentJudgment) return;

    const entry: FearedFantasyEntry = {
      judgment: currentJudgment,
      method: selectedMethod,
      response,
    };

    setEntries((prev) => [...prev, entry]);

    if (isLastResponse) {
      setPhase('complete');
      return;
    }

    const nextIndex = responseIndex + 1;
    setResponseIndex(nextIndex);
    setSelectedMethod('curiosity');
    setResponseDraft(getResponseMethodConfig('curiosity').example);
  }, [currentJudgment, isLastResponse, responseDraft, responseIndex, selectedMethod]);

  if (phase === 'setup') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={formStyles.screenContent}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>The Feared Fantasy</Text>
          <Text style={styles.introBody}>
            Fear is rarely vague — it is specific words you imagine others thinking. Write those
            thoughts down, respond to them, and drain the charge so you can act anyway.
          </Text>
        </View>

        <FearedFantasyGuide phase="setup" />

        <View style={styles.setupSection}>
          <Text style={styles.setupLabel}>Action you are avoiding</Text>
          <TextInput
            style={[formStyles.input, formStyles.textarea]}
            value={fearedAction}
            onChangeText={setFearedAction}
            placeholder="e.g. Speak up in the team meeting, ask them for coffee…"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Text style={styles.setupHint}>
            Be concrete — the more specific the action, the sharper the exercise.
          </Text>
        </View>

        <Pressable
          style={[styles.startBtn, !canStartJudgments && styles.startBtnDisabled]}
          onPress={startJudgmentsPhase}
          disabled={!canStartJudgments}>
          <Ionicons name="play" size={18} color={colors.onPrimary} />
          <Text style={styles.startBtnText}>Start</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'judgments') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={formStyles.screenContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionMode}>Feared thoughts</Text>
            <Text style={styles.sessionProgress}>
              {judgments.length}/{MAX_JUDGMENTS}
            </Text>
          </View>

          <View style={styles.actionCard}>
            <Text style={styles.actionLabel}>Your action</Text>
            <Text style={styles.actionText}>{trimmedAction}</Text>
          </View>

          <FearedFantasyGuide phase="judgments" />

          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>What might they think or say?</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[formStyles.input, styles.input]}
                value={judgmentDraft}
                onChangeText={setJudgmentDraft}
                placeholder={'e.g. "That was awkward"'}
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={() => addJudgment(judgmentDraft)}
                returnKeyType="done"
              />
              <Pressable
                style={[
                  styles.addBtn,
                  (!judgmentDraft.trim() || judgments.length >= MAX_JUDGMENTS) &&
                    styles.addBtnDisabled,
                ]}
                onPress={() => addJudgment(judgmentDraft)}
                disabled={!judgmentDraft.trim() || judgments.length >= MAX_JUDGMENTS}>
                <Ionicons name="add" size={22} color={colors.onPrimary} />
              </Pressable>
            </View>
            <Text style={styles.setupHint}>
              Add at least {MIN_JUDGMENTS} specific negative thought
              {MIN_JUDGMENTS === 1 ? '' : 's'}. Not "judgment" — the actual words.
            </Text>
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>Quick starters</Text>
            <View style={formStyles.chipRow}>
              {JUDGMENT_STARTERS.map((starter) => {
                const isUsed = judgments.some(
                  (entry) => entry.toLowerCase() === starter.toLowerCase()
                );
                return (
                  <Pressable
                    key={starter}
                    style={[styles.starterChip, isUsed && styles.starterChipUsed]}
                    onPress={() => addJudgment(starter)}
                    disabled={isUsed || judgments.length >= MAX_JUDGMENTS}>
                    <Text style={[styles.starterChipText, isUsed && styles.starterChipTextUsed]}>
                      {starter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {judgments.length > 0 ? (
            <View style={styles.listSection}>
              <Text style={styles.listTitle}>Your feared thoughts</Text>
              {judgments.map((judgment, index) => (
                <View key={`${judgment}-${index}`} style={styles.listRow}>
                  <Text style={styles.listQuote}>"{judgment}"</Text>
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => removeJudgment(index)}
                    hitSlop={8}>
                    <Ionicons name="close" size={16} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            style={[styles.secondaryBtn, suggestLoading && styles.startBtnDisabled]}
            onPress={() => void loadSuggestions()}
            disabled={suggestLoading || judgments.length >= MAX_JUDGMENTS}>
            <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>
              {suggestLoading ? 'Suggesting…' : 'Suggest feared thoughts'}
            </Text>
          </Pressable>

          {!isSparkAiConfigured() ? (
            <Text style={styles.setupHint}>
              Using built-in suggestions. Add EXPO_PUBLIC_SPARK_AI_API_KEY for action-specific
              thoughts.
            </Text>
          ) : null}

          <Pressable
            style={[styles.startBtn, !canContinueToResponses && styles.startBtnDisabled]}
            onPress={beginResponses}
            disabled={!canContinueToResponses}>
            <Text style={styles.startBtnText}>Continue to responses</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
          </Pressable>

          <IconButton icon="options-outline" label="Change action" onPress={resetSession} variant="surface" />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (phase === 'responding') {
    const methodConfig = getResponseMethodConfig(selectedMethod);

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={formStyles.screenContent}
          keyboardShouldPersistTaps="handled">
          <FearedFantasyProgress currentIndex={responseIndex} total={judgments.length} />

          <View style={styles.judgmentCard}>
            <Text style={styles.judgmentLabel}>They might think or say</Text>
            <Text style={styles.judgmentText}>"{currentJudgment}"</Text>
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>How do you respond?</Text>
            <View style={styles.modeRow}>
              {RESPONSE_METHODS.map((method) => (
                <Pressable
                  key={method.id}
                  style={[styles.modeChip, selectedMethod === method.id && styles.modeChipActive]}
                  onPress={() => selectMethod(method.id)}>
                  <Ionicons
                    name={method.icon}
                    size={14}
                    color={selectedMethod === method.id ? colors.onPrimary : colors.primary}
                  />
                  <Text
                    style={[
                      styles.modeChipText,
                      selectedMethod === method.id && styles.modeChipTextActive,
                    ]}>
                    {method.shortLabel}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.setupHint}>{methodConfig.hint}</Text>
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>Your reply · {methodConfig.label}</Text>
            <TextInput
              style={[formStyles.input, formStyles.textarea]}
              value={responseDraft}
              onChangeText={setResponseDraft}
              placeholder={methodConfig.example}
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Text style={styles.setupHint}>Edit the example or write your own. Say it out loud.</Text>
          </View>

          <Pressable
            style={[styles.startBtn, !responseDraft.trim() && styles.startBtnDisabled]}
            onPress={saveResponse}
            disabled={!responseDraft.trim()}>
            <Text style={styles.startBtnText}>
              {isLastResponse ? 'Finish exercise' : 'Save & next thought'}
            </Text>
            <Ionicons
              name={isLastResponse ? 'checkmark' : 'arrow-forward'}
              size={18}
              color={colors.onPrimary}
            />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={formStyles.screenContent}>
      <FearedFantasyGuide phase="complete" />

      <View style={styles.completeCard}>
        <Ionicons name="megaphone-outline" size={28} color={colors.success} />
        <Text style={styles.completeTitle}>Now take the real action</Text>
        <Text style={styles.completeBody}>
          You exposed the worst-case thoughts and practiced replies. The shift happens when you do
          the thing — imperfectly, even while scared.
        </Text>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionLabel}>Your action</Text>
        <Text style={styles.actionText}>{trimmedAction}</Text>
      </View>

      <View style={styles.scriptSection}>
        <Text style={styles.scriptTitle}>Roleplay script</Text>
        <Text style={styles.scriptHint}>
          Read aloud with a friend or coach — they read the feared line, you read your response.
        </Text>
        {entries.map((entry, index) => {
          const methodLabel = getResponseMethodConfig(entry.method).label;
          return (
            <View key={`${entry.judgment}-${index}`} style={styles.scriptBlock}>
              <View style={styles.scriptLine}>
                <Text style={styles.scriptSpeaker}>Feared fantasy</Text>
                <Text style={styles.scriptFeared}>"{entry.judgment}"</Text>
              </View>
              <View style={styles.scriptArrow}>
                <Ionicons name="arrow-down" size={14} color={colors.textMuted} />
              </View>
              <View style={styles.scriptLine}>
                <Text style={styles.scriptSpeaker}>You · {methodLabel}</Text>
                <Text style={styles.scriptResponse}>{entry.response}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.actionRow}>
        <IconButton icon="refresh-outline" label="Practice again" onPress={resetSession} variant="primary" />
        <IconButton
          icon="create-outline"
          label="Same action, new thoughts"
          onPress={() => {
            setEntries([]);
            setResponseIndex(0);
            setPhase('judgments');
          }}
          variant="surface"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  introBody: {
    fontSize: 14,
    lineHeight: 20,
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
    letterSpacing: 0.4,
  },
  setupHint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  startBtnDisabled: {
    opacity: 0.45,
  },
  startBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionMode: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sessionProgress: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  actionCard: {
    backgroundColor: colors.selected,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  actionText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
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
  starterChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  starterChipUsed: {
    opacity: 0.4,
  },
  starterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  starterChipTextUsed: {
    color: colors.textMuted,
  },
  listSection: {
    gap: spacing.sm,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listQuote: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  removeBtn: {
    padding: 4,
  },
  judgmentCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  judgmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  judgmentText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeChipTextActive: {
    color: colors.onPrimary,
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
  scriptSection: {
    gap: spacing.md,
  },
  scriptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  scriptHint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  scriptBlock: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  scriptLine: {
    gap: 4,
  },
  scriptSpeaker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scriptFeared: {
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  scriptResponse: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    fontWeight: '600',
  },
  scriptArrow: {
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
