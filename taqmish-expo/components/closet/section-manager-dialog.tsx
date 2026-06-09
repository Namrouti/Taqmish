import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { push, ref as databaseRef, remove, set, update } from 'firebase/database';

import { LuxuryTheme } from '@/constants/theme';
import { database } from '@/lib/firebase';
import type { CapturedType, DisplaySection, SectionDialogMode } from '@/types/closet';
import { capturedTypes, DEFAULT_SECTION_ICONS } from '@/utils/closet-helpers';

export type SectionManagerDialogProps = {
  defaultParentId: string | null;
  editingSection: DisplaySection | null;
  mode: SectionDialogMode;
  sections: DisplaySection[];
  sectionIdsMap: Map<string, Set<string>>;
  sectionItemCounts: Map<string, number>;
  userId: string;
  visible: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onSaved: (newSectionId?: string) => void;
};

export function SectionManagerDialog({
  defaultParentId,
  editingSection,
  mode,
  sections,
  sectionIdsMap,
  sectionItemCounts,
  userId,
  visible,
  onClose,
  onDeleted,
  onSaved,
}: SectionManagerDialogProps) {
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionTypes, setNewSectionTypes] = useState<CapturedType[]>(['Top']);
  const [newSectionParentId, setNewSectionParentId] = useState<string | null>(null);
  const [selectedSectionIcon, setSelectedSectionIcon] = useState(DEFAULT_SECTION_ICONS[0]);
  const [isSavingSection, setIsSavingSection] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (mode === 'edit' && editingSection) {
      setNewSectionName(editingSection.name);
      setNewSectionTypes(editingSection.types.length ? editingSection.types : ['Top']);
      setNewSectionParentId(editingSection.parentSectionId ?? null);
      setSelectedSectionIcon(editingSection.iconKey ?? DEFAULT_SECTION_ICONS[0]);
    } else {
      setNewSectionName('');
      setNewSectionTypes(['Top']);
      setNewSectionParentId(defaultParentId);
      setSelectedSectionIcon(DEFAULT_SECTION_ICONS[0]);
    }
  }, [visible, mode, editingSection, defaultParentId]);

  const availableParentSections =
    mode === 'edit' && editingSection
      ? sections.filter((s) => !(sectionIdsMap.get(editingSection.id) ?? new Set([editingSection.id])).has(s.id))
      : sections;

  const toggleType = (type: CapturedType) => {
    setNewSectionTypes((current) => {
      if (current.includes(type)) {
        if (current.length === 1) return current;
        return current.filter((entry) => entry !== type);
      }
      return [...current, type];
    });
  };

  const saveSection = async () => {
    const trimmedName = newSectionName.trim();
    if (!trimmedName) {
      Alert.alert('Enter a section name first.');
      return;
    }
    if (!newSectionTypes.length) {
      Alert.alert('Select at least one type for this section.');
      return;
    }

    setIsSavingSection(true);

    try {
      const parentSection =
        sections.find((s) => s.id === newSectionParentId) ?? null;

      if (mode === 'create') {
        const sectionRef = push(databaseRef(database, `ClosetSections/${userId}`));
        const id = sectionRef.key;
        if (!id) throw new Error('Unable to create section id.');
        await set(sectionRef, {
          iconKey: selectedSectionIcon,
          id,
          name: trimmedName,
          parentSectionId: parentSection?.id ?? null,
          parentSectionName: parentSection?.name ?? null,
          types: newSectionTypes,
        });
        onSaved(id);
      } else if (editingSection) {
        await update(databaseRef(database, `ClosetSections/${userId}/${editingSection.id}`), {
          iconKey: selectedSectionIcon,
          name: trimmedName,
          parentSectionId: parentSection?.id ?? null,
          parentSectionName: parentSection?.name ?? null,
          types: newSectionTypes,
        });
        onSaved();
      }

      Alert.alert(mode === 'create' ? 'Closet section created.' : 'Closet section updated.');
    } catch (error) {
      Alert.alert('Failed to save section.', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSavingSection(false);
    }
  };

  const deleteSection = async () => {
    if (!editingSection) return;
    const linkedItemsCount = sectionItemCounts.get(editingSection.id) ?? 0;
    if (linkedItemsCount > 0) {
      Alert.alert('Cannot delete this section because it still contains items.');
      return;
    }
    try {
      await remove(databaseRef(database, `ClosetSections/${userId}/${editingSection.id}`));
      onDeleted();
      Alert.alert('Closet section deleted.');
    } catch (error) {
      Alert.alert('Failed to delete section.', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.dialogOverlay}>
        <Pressable style={styles.dialogBackdrop} onPress={onClose} />
        <View style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>
            {mode === 'create' ? 'Add Closet Section' : 'Edit Closet Section'}
          </Text>
          <Text style={styles.dialogSubtitle}>
            Create a custom section and choose one or more clothing types for it.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Section name</Text>
            <View style={styles.sectionNameWrap}>
              <TextInput
                onChangeText={setNewSectionName}
                placeholder="Example: Dresses and Hats"
                placeholderTextColor="#B39A88"
                style={styles.sectionNameInput}
                value={newSectionName}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Included types</Text>
            <View style={styles.typeRowWrap}>
              {capturedTypes.map((type) => {
                const selected = newSectionTypes.includes(type);
                return (
                  <Pressable
                    key={type}
                    onPress={() => toggleType(type)}
                    style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                    <Text
                      style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Default logo</Text>
            <View style={styles.typeRowWrap}>
              {DEFAULT_SECTION_ICONS.map((iconName) => {
                const selected = selectedSectionIcon === iconName;
                return (
                  <Pressable
                    key={iconName}
                    onPress={() => setSelectedSectionIcon(iconName)}
                    style={[styles.iconChip, selected ? styles.typeChipSelected : null]}>
                    <Ionicons
                      color={selected ? LuxuryTheme.accentSoft : LuxuryTheme.textMuted}
                      name={iconName as keyof typeof Ionicons.glyphMap}
                      size={18}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parent section</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeRow}>
                <Pressable
                  onPress={() => setNewSectionParentId(null)}
                  style={[styles.typeChip, newSectionParentId === null ? styles.typeChipSelected : null]}>
                  <Text
                    style={[styles.typeChipText, newSectionParentId === null ? styles.typeChipTextSelected : null]}>
                    Main section
                  </Text>
                </Pressable>
                {availableParentSections.map((s) => {
                  const selected = newSectionParentId === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => setNewSectionParentId(s.id)}
                      style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                      <Text
                        style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>
                        {s.pathLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={styles.dialogActions}>
            <Pressable
              disabled={isSavingSection}
              onPress={onClose}
              style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            {mode === 'edit' ? (
              <Pressable
                disabled={isSavingSection}
                onPress={() => void deleteSection()}
                style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            ) : null}
            <Pressable
              disabled={isSavingSection}
              onPress={() => void saveSection()}
              style={styles.primaryButton}>
              {isSavingSection ? (
                <ActivityIndicator color={LuxuryTheme.textStrong} />
              ) : (
                <Text style={styles.primaryButtonText}>Save section</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#C75146',
    borderRadius: 14,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFF7F1',
    fontSize: 13,
    fontWeight: '800',
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
  iconChip: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
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
  section: {
    marginTop: 16,
  },
  sectionNameInput: {
    color: LuxuryTheme.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  sectionNameWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sectionTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 14,
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
