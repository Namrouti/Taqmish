import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { ref as databaseRef, remove, update } from 'firebase/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LuxuryTheme } from '@/constants/theme';
import { database } from '@/lib/firebase';
import type { ClosetItem } from '@/hooks/use-closet-items';
import {
  DEFAULT_AGE_OPTIONS,
  DEFAULT_BODY_PART_OPTIONS,
  DEFAULT_SEASON_TAGS,
  DEFAULT_SIZE_OPTIONS,
  DEFAULT_STYLE_TAGS,
  resolveImageUri,
} from '@/utils/closet-helpers';

export type ClosetItemDetailModalProps = {
  item: ClosetItem | null;
  userId: string;
  onClose: () => void;
  onItemDeleted: (itemId: string) => void;
  onItemUpdated: (itemId: string, updatedFields: Partial<ClosetItem>) => void;
};

function resolveBodyPartKey(bodyPart: string) {
  if (bodyPart === 'الجزء العلوي') return 'top';
  if (bodyPart === 'الجزء السفلي') return 'bottom';
  if (bodyPart === 'أحذية') return 'shoes';
  return 'accessory';
}

function areStringListsEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

export function ClosetItemDetailModal({
  item,
  userId,
  onClose,
  onItemDeleted,
  onItemUpdated,
}: ClosetItemDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [isEditVisible, setEditVisible] = useState(false);
  const [editingItemBodyPart, setEditingItemBodyPart] = useState(DEFAULT_BODY_PART_OPTIONS[0]);
  const [editingItemStyleTags, setEditingItemStyleTags] = useState<string[]>(['casual']);
  const [editingItemSeasonTags, setEditingItemSeasonTags] = useState<string[]>([]);
  const [editingItemSize, setEditingItemSize] = useState('');
  const [editingItemAge, setEditingItemAge] = useState('');
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const openEditDialog = () => {
    if (!item) return;
    setEditingItemBodyPart(item.bodyPart || DEFAULT_BODY_PART_OPTIONS[0]);
    setEditingItemStyleTags(item.styleTags?.length ? item.styleTags : ['casual']);
    setEditingItemSeasonTags(item.seasonTags ?? []);
    setEditingItemSize(item.size || '');
    setEditingItemAge(item.age || '');
    setEditVisible(true);
  };

  const toggleStyleTag = (tag: string) => {
    setEditingItemStyleTags((current) => {
      if (current.includes(tag)) {
        if (current.length === 1) return current;
        return current.filter((entry) => entry !== tag);
      }
      return [...current, tag];
    });
  };

  const toggleSeasonTag = (tag: string) => {
    setEditingItemSeasonTags((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    );
  };

  const normalizedUpdatePayload = useMemo(() => ({
    age: editingItemAge.trim() || 'adult',
    bodyPart: editingItemBodyPart,
    bodyPartKey: resolveBodyPartKey(editingItemBodyPart),
    seasonTags: editingItemSeasonTags,
    size: editingItemSize.trim() || 'One Size',
    styleTags: editingItemStyleTags.length ? editingItemStyleTags : ['casual'],
  }), [editingItemAge, editingItemBodyPart, editingItemSeasonTags, editingItemSize, editingItemStyleTags]);

  const hasChanges = useMemo(() => {
    if (!item) return false;
    return (
      (item.age || 'adult') !== normalizedUpdatePayload.age ||
      (item.bodyPart || DEFAULT_BODY_PART_OPTIONS[0]) !== normalizedUpdatePayload.bodyPart ||
      (item.bodyPartKey || resolveBodyPartKey(item.bodyPart || DEFAULT_BODY_PART_OPTIONS[0])) !== normalizedUpdatePayload.bodyPartKey ||
      (item.size || 'One Size') !== normalizedUpdatePayload.size ||
      !areStringListsEqual(item.seasonTags ?? [], normalizedUpdatePayload.seasonTags) ||
      !areStringListsEqual(item.styleTags?.length ? item.styleTags : ['casual'], normalizedUpdatePayload.styleTags)
    );
  }, [item, normalizedUpdatePayload]);

  const saveEditedItem = async () => {
    if (!userId || !item?.id) return;
    if (!hasChanges) {
      setEditVisible(false);
      return;
    }
    setIsUpdatingItem(true);
    try {
      await Promise.all([
        update(databaseRef(database, `SiteClosets/${userId}/${item.id}`), normalizedUpdatePayload),
        update(databaseRef(database, `userClosetItems/${userId}/${item.id}`), normalizedUpdatePayload),
      ]);
      onItemUpdated(item.id, normalizedUpdatePayload);
      setEditVisible(false);
      Alert.alert('Item updated successfully.');
    } catch (error) {
      Alert.alert('Failed to update item.', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const confirmDeleteItem = () => {
    if (!item?.id || isDeletingItem || isUpdatingItem) return;
    Alert.alert(
      'Delete item?',
      'This will remove the item from your closet.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => void deleteItem(),
        },
      ]
    );
  };

  const deleteItem = async () => {
    if (!userId || !item?.id) return;
    setIsDeletingItem(true);
    try {
      await Promise.all([
        remove(databaseRef(database, `SiteClosets/${userId}/${item.id}`)),
        remove(databaseRef(database, `userClosetItems/${userId}/${item.id}`)),
      ]);
      onItemDeleted(item.id);
      setEditVisible(false);
      onClose();
      Alert.alert('Item deleted successfully.');
    } catch (error) {
      Alert.alert('Failed to delete item.', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsDeletingItem(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      visible={item !== null}
      onRequestClose={() => {
        if (isEditVisible) {
          setEditVisible(false);
          return;
        }
        onClose();
      }}>
      <View
        style={[
          styles.screen,
          { paddingBottom: Math.max(insets.bottom, 12), paddingTop: insets.top + 12 },
        ]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (isEditVisible) {
                setEditVisible(false);
                return;
              }
              onClose();
            }}
            style={styles.backButton}>
            <Text style={styles.backText}>{isEditVisible ? 'Back to details' : 'Back'}</Text>
          </Pressable>
          <Text style={styles.title}>{isEditVisible ? 'Edit Item' : 'Item Details'}</Text>
        </View>
        {item ? (
          isEditVisible ? (
            <View style={styles.inlineEditWrap}>
              <View style={styles.dialogCardInline}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.dialogContent}>
                  <Text style={styles.dialogTitle}>Edit Item</Text>
                  <Text style={styles.dialogSubtitle}>
                    Update the details used for closet filters and outfit suggestions.
                  </Text>

                  <View style={styles.selectionSummary}>
                    <View style={styles.selectionSummaryCard}>
                      <Text style={styles.selectionSummaryLabel}>Body part</Text>
                      <Text style={styles.selectionSummaryValue}>{editingItemBodyPart}</Text>
                    </View>
                    <View style={styles.selectionSummaryCard}>
                      <Text style={styles.selectionSummaryLabel}>Size</Text>
                      <Text style={styles.selectionSummaryValue}>{normalizedUpdatePayload.size}</Text>
                    </View>
                    <View style={styles.selectionSummaryCard}>
                      <Text style={styles.selectionSummaryLabel}>Age</Text>
                      <Text style={styles.selectionSummaryValue}>{normalizedUpdatePayload.age}</Text>
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Body part</Text>
                    <View style={styles.typeRowWrap}>
                      {DEFAULT_BODY_PART_OPTIONS.map((option) => {
                        const selected = editingItemBodyPart === option;
                        return (
                          <Pressable
                            key={option}
                            onPress={() => setEditingItemBodyPart(option)}
                            style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                            <Text
                              style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Style tags</Text>
                    <Text style={styles.formHelperText}>Pick one or more styles.</Text>
                    <View style={styles.typeRowWrap}>
                      {DEFAULT_STYLE_TAGS.map((tag) => {
                        const selected = editingItemStyleTags.includes(tag);
                        return (
                          <Pressable
                            key={tag}
                            onPress={() => toggleStyleTag(tag)}
                            style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                            <Text
                              style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>
                              {tag}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Season</Text>
                    <Text style={styles.formHelperText}>Leave empty if the item works all year.</Text>
                    <View style={styles.typeRowWrap}>
                      {DEFAULT_SEASON_TAGS.map((tag) => {
                        const selected = editingItemSeasonTags.includes(tag);
                        return (
                          <Pressable
                            key={tag}
                            onPress={() => toggleSeasonTag(tag)}
                            style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                            <Text
                              style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>
                              {tag}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Size</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.typeRow}>
                        {DEFAULT_SIZE_OPTIONS.map((option) => {
                          const selected = editingItemSize === option;
                          return (
                            <Pressable
                              key={option}
                              onPress={() => setEditingItemSize(option)}
                              style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                              <Text
                                style={[
                                  styles.typeChipText,
                                  selected ? styles.typeChipTextSelected : null,
                                ]}>
                                {option}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Age group</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.typeRow}>
                        {DEFAULT_AGE_OPTIONS.map((option) => {
                          const selected = editingItemAge === option;
                          return (
                            <Pressable
                              key={option}
                              onPress={() => setEditingItemAge(option)}
                              style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                              <Text
                                style={[
                                  styles.typeChipText,
                                  selected ? styles.typeChipTextSelected : null,
                                ]}>
                                {option}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>Custom size or age</Text>
                    <Text style={styles.formHelperText}>Use this only if the quick picks do not fit.</Text>
                    <View style={styles.editFieldsRow}>
                      <View style={styles.editFieldWrap}>
                        <Text style={styles.inputLabel}>Size</Text>
                        <TextInput
                          onChangeText={setEditingItemSize}
                          placeholder="Size"
                          placeholderTextColor="#B39A88"
                          style={styles.sectionNameInput}
                          value={editingItemSize}
                        />
                      </View>
                      <View style={styles.editFieldWrap}>
                        <Text style={styles.inputLabel}>Age</Text>
                        <TextInput
                          onChangeText={setEditingItemAge}
                          placeholder="Age"
                          placeholderTextColor="#B39A88"
                          style={styles.sectionNameInput}
                          value={editingItemAge}
                        />
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.dialogActions}>
                  <Pressable
                    disabled={isUpdatingItem}
                    onPress={() => setEditVisible(false)}
                    style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    disabled={isUpdatingItem || !hasChanges}
                    onPress={() => void saveEditedItem()}
                    style={[styles.primaryButton, !hasChanges ? styles.primaryButtonDisabled : null]}>
                    {isUpdatingItem ? (
                      <ActivityIndicator color={LuxuryTheme.textStrong} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Save item</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              <View style={styles.card}>
                {resolveImageUri(item.filePath) ? (
                  <Image
                    source={{ uri: resolveImageUri(item.filePath)! }}
                    style={styles.image}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.fallback}>
                    <Text style={styles.fallbackText}>{item.subParts || 'Item'}</Text>
                  </View>
                )}
                <Text style={styles.name}>
                  {item.subParts || item.bodyPart || 'Closet item'}
                </Text>
                <Text style={styles.meta}>
                  Section: {item.closetSectionPath || item.closetSectionName || 'No section'}
                </Text>
                <Text style={styles.meta}>Body part: {item.bodyPart || 'Unknown'}</Text>
                <Text style={styles.meta}>
                  Tags: {(item.styleTags ?? []).join(', ') || 'No tags'}
                </Text>
                <Text style={styles.meta}>
                  Season: {(item.seasonTags ?? []).join(', ') || 'All season'}
                </Text>
                <Text style={styles.meta}>Size: {item.size || 'One Size'}</Text>
                <Text style={styles.meta}>Age: {item.age || 'adult'}</Text>
                <Text style={styles.meta}>Colors</Text>
                <View style={styles.colorsRow}>
                  {(item.colors ?? []).length ? (
                    (item.colors ?? []).map((color, colorIndex) => (
                      <View
                        key={`${item.id ?? 'detail'}-${color}-${colorIndex}`}
                        style={[styles.colorSwatch, { backgroundColor: color }]}
                      />
                    ))
                  ) : (
                    <Text style={styles.meta}>No saved colors</Text>
                  )}
                </View>
                <Pressable onPress={openEditDialog} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit item</Text>
                </Pressable>
                <Pressable
                  disabled={isDeletingItem}
                  onPress={confirmDeleteItem}
                  style={[styles.deleteButton, isDeletingItem ? styles.primaryButtonDisabled : null]}>
                  {isDeletingItem ? (
                    <ActivityIndicator color="#B42318" />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete item</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    color: LuxuryTheme.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  colorSwatch: {
    borderColor: LuxuryTheme.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 26,
    marginRight: 8,
    width: 26,
  },
  colorsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  dialogCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 26,
    borderWidth: 1,
    maxHeight: '86%',
    marginHorizontal: 18,
    padding: 18,
  },
  dialogContent: {
    paddingBottom: 6,
  },
  dialogSubtitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  dialogTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 22,
    fontWeight: '800',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(180, 35, 24, 0.08)',
    borderColor: '#B42318',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '800',
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editButtonText: {
    color: LuxuryTheme.accentSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  editFieldsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  editFieldWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 18,
    height: 260,
    justifyContent: 'center',
  },
  fallbackText: {
    color: LuxuryTheme.textStrong,
    fontSize: 16,
    fontWeight: '700',
  },
  formSection: {
    marginTop: 16,
  },
  formHelperText: {
    color: LuxuryTheme.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  formSectionTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 14,
    fontWeight: '800',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  inlineEditWrap: {
    flex: 1,
  },
  image: {
    borderRadius: 18,
    height: 260,
    width: '100%',
  },
  dialogCardInline: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 26,
    borderWidth: 1,
    flex: 1,
    padding: 18,
  },
  list: {
    paddingBottom: 24,
  },
  meta: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    marginTop: 6,
  },
  name: {
    color: LuxuryTheme.textStrong,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 14,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#120F0D',
    fontSize: 13,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.accent,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: LuxuryTheme.accentSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionNameInput: {
    color: LuxuryTheme.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  inputLabel: {
    color: LuxuryTheme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  selectionSummary: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  selectionSummaryCard: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectionSummaryLabel: {
    color: LuxuryTheme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectionSummaryValue: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: LuxuryTheme.textStrong,
    fontSize: 20,
    fontWeight: '800',
  },
  typeChip: {
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typeChipSelected: {
    backgroundColor: LuxuryTheme.chipActive,
    borderColor: LuxuryTheme.accent,
  },
  typeChipText: {
    color: LuxuryTheme.textStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  typeChipTextSelected: {
    color: LuxuryTheme.chipActiveText,
  },
  typeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  typeRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
});
