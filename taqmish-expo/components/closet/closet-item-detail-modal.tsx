import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { ref as databaseRef, update } from 'firebase/database';
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
  onItemUpdated: (updatedFields: Partial<ClosetItem>) => void;
};

export function ClosetItemDetailModal({
  item,
  userId,
  onClose,
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

  const saveEditedItem = async () => {
    if (!userId || !item?.id) return;
    setIsUpdatingItem(true);
    try {
      const updatePayload = {
        age: editingItemAge.trim() || 'adult',
        bodyPart: editingItemBodyPart,
        bodyPartKey:
          editingItemBodyPart === 'الجزء العلوي'
            ? 'top'
            : editingItemBodyPart === 'الجزء السفلي'
              ? 'bottom'
              : editingItemBodyPart === 'أحذية'
                ? 'shoes'
                : 'accessory',
        seasonTags: editingItemSeasonTags,
        size: editingItemSize.trim() || 'One Size',
        styleTags: editingItemStyleTags.length ? editingItemStyleTags : ['casual'],
      };
      await Promise.all([
        update(databaseRef(database, `SiteClosets/${userId}/${item.id}`), updatePayload),
        update(databaseRef(database, `userClosetItems/${userId}/${item.id}`), updatePayload),
      ]);
      onItemUpdated(updatePayload);
      setEditVisible(false);
      Alert.alert('Item updated successfully.');
    } catch (error) {
      Alert.alert('Failed to update item.', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsUpdatingItem(false);
    }
  };

  return (
    <>
      <Modal
        animationType="slide"
        visible={item !== null}
        onRequestClose={onClose}>
        <View
          style={[
            styles.screen,
            { paddingBottom: Math.max(insets.bottom, 12), paddingTop: insets.top + 12 },
          ]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <Text style={styles.title}>Item Details</Text>
          </View>
          {item ? (
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
              </View>
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isEditVisible}
        onRequestClose={() => setEditVisible(false)}>
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => setEditVisible(false)} />
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Edit Item</Text>
            <Text style={styles.dialogSubtitle}>
              Update the body part, style, season, size, and age group used in filtering and outfit building.
            </Text>

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
              <View style={styles.editFieldsRow}>
                <View style={styles.editFieldWrap}>
                  <TextInput
                    onChangeText={setEditingItemSize}
                    placeholder="Size"
                    placeholderTextColor="#B39A88"
                    style={styles.sectionNameInput}
                    value={editingItemSize}
                  />
                </View>
                <View style={styles.editFieldWrap}>
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

            <View style={styles.dialogActions}>
              <Pressable
                disabled={isUpdatingItem}
                onPress={() => setEditVisible(false)}
                style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={isUpdatingItem}
                onPress={() => void saveEditedItem()}
                style={styles.primaryButton}>
                {isUpdatingItem ? (
                  <ActivityIndicator color={LuxuryTheme.textStrong} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save item</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  dialogBackdrop: {
    flex: 1,
  },
  dialogCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 26,
    borderWidth: 1,
    marginHorizontal: 18,
    padding: 18,
  },
  dialogOverlay: {
    backgroundColor: LuxuryTheme.overlay,
    flex: 1,
    justifyContent: 'center',
  },
  dialogSubtitle: {
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  dialogTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 22,
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
    color: LuxuryTheme.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  formSection: {
    marginTop: 16,
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
  image: {
    borderRadius: 18,
    height: 260,
    width: '100%',
  },
  list: {
    paddingBottom: 24,
  },
  meta: {
    color: LuxuryTheme.textMuted,
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
    color: LuxuryTheme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  typeChipTextSelected: {
    color: LuxuryTheme.accentSoft,
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
