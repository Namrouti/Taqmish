import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/providers/auth-provider';
import { useStoreItems } from '@/hooks/use-store-items';
import { useStoreProfile } from '@/hooks/use-store-profile';
import { useStoreSections } from '@/hooks/use-store-sections';

const STORE_TYPES = ['clothing', 'shoes', 'accessories', 'mixed'] as const;
const SECTION_TYPES = ['Top', 'Bottom', 'Shoes', 'Accessories', 'Bag', 'Hat', 'Watch'] as const;

export default function StoreProfileScreen() {
  const { authUser } = useAuth();
  const { profile, saveProfile } = useStoreProfile(authUser?.uid);
  const { inventoryCount, items } = useStoreItems(authUser?.uid);
  const { createSection, rootSections, sections } = useStoreSections(authUser?.uid);
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [storeType, setStoreType] = useState<(typeof STORE_TYPES)[number]>('clothing');
  const [isSectionDialogVisible, setSectionDialogVisible] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [parentSectionId, setParentSectionId] = useState<string | null>(null);
  const [selectedSectionTypes, setSelectedSectionTypes] = useState<string[]>(['Top']);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setStoreName(profile.storeName ?? '');
    setDescription(profile.description ?? '');
    setPhone(profile.phone ?? '');
    setCity(profile.city ?? '');
    setLogoUrl(profile.logoUrl ?? '');
    setStoreType(profile.storeType ?? 'clothing');
  }, [profile]);

  const sectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (!item.sectionId) {
        continue;
      }
      counts.set(item.sectionId, (counts.get(item.sectionId) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  if (!authUser) {
    return <Redirect href="/login" />;
  }

  const handleSave = async () => {
    if (!storeName.trim()) {
      Alert.alert('Store profile', 'Enter the store name first.');
      return;
    }

    await saveProfile({
      city: city.trim(),
      description: description.trim(),
      inventoryCount,
      logoUrl: logoUrl.trim(),
      ownerEmail: authUser.email ?? '',
      ownerId: authUser.uid,
      phone: phone.trim(),
      status: 'pending',
      storeName: storeName.trim(),
      storeType,
    });

    Alert.alert('Store profile', 'Store profile saved.');
  };

  const toggleSectionType = (type: string) => {
    setSelectedSectionTypes((current) =>
      current.includes(type) ? current.filter((entry) => entry !== type) : [...current, type]
    );
  };

  const resetSectionDialog = () => {
    setSectionName('');
    setParentSectionId(null);
    setSelectedSectionTypes(['Top']);
    setSectionDialogVisible(false);
  };

  const handleCreateSection = async () => {
    if (!sectionName.trim()) {
      Alert.alert('Store sections', 'Enter the section name first.');
      return;
    }

    const parentSection = sections.find((entry) => entry.id === parentSectionId) ?? null;
    const pathLabel = parentSection ? `${parentSection.pathLabel ?? parentSection.name} / ${sectionName.trim()}` : sectionName.trim();

    await createSection({
      name: sectionName.trim(),
      ownerId: authUser.uid,
      parentSectionId: parentSection?.id ?? null,
      parentSectionName: parentSection?.name ?? null,
      pathLabel,
      types: selectedSectionTypes,
    });

    resetSectionDialog();
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Store profile</Text>
      <Text style={styles.subtitle}>Set the public identity and structure that Taqmish shoppers will see.</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Products</Text>
          <Text style={styles.summaryValue}>{items.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Inventory</Text>
          <Text style={styles.summaryValue}>{inventoryCount}</Text>
        </View>
      </View>

      <TextInput onChangeText={setStoreName} placeholder="Store name" style={styles.input} value={storeName} />
      <TextInput onChangeText={setDescription} placeholder="Store description" style={[styles.input, styles.multiline]} value={description} multiline />
      <TextInput onChangeText={setPhone} placeholder="Phone" style={styles.input} value={phone} />
      <TextInput onChangeText={setCity} placeholder="City" style={styles.input} value={city} />
      <TextInput onChangeText={setLogoUrl} placeholder="Logo URL" style={styles.input} value={logoUrl} />

      <View style={styles.typeRow}>
        {STORE_TYPES.map((type) => (
          <Pressable
            key={type}
            onPress={() => setStoreType(type)}
            style={[styles.typeChip, storeType === type ? styles.typeChipSelected : null]}>
            <Text style={[styles.typeChipText, storeType === type ? styles.typeChipTextSelected : null]}>{type}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => void handleSave()} style={styles.button}>
        <Text style={styles.buttonText}>Save store profile</Text>
      </Pressable>

      <View style={styles.sectionsHeader}>
        <View>
          <Text style={styles.sectionsTitle}>Store sections</Text>
          <Text style={styles.sectionsMeta}>Create roots and subsections to organize your inventory.</Text>
        </View>
        <Pressable onPress={() => setSectionDialogVisible(true)} style={styles.addSectionButton}>
          <Ionicons color="#FFF7F1" name="add-outline" size={16} />
          <Text style={styles.addSectionButtonText}>Add section</Text>
        </Pressable>
      </View>

      {rootSections.map((section) => {
        const children = sections.filter((entry) => entry.parentSectionId === section.id);
        return (
          <View key={section.id} style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View>
                <Text style={styles.sectionCardTitle}>{section.name}</Text>
                <Text style={styles.sectionCardMeta}>
                  {sectionCounts.get(section.id) ?? 0} items
                  {section.types?.length ? ` • ${section.types.join(', ')}` : ''}
                </Text>
              </View>
              <Ionicons color="#A58D78" name="folder-open-outline" size={18} />
            </View>
            {children.length ? (
              <View style={styles.childrenWrap}>
                {children.map((child) => (
                  <View key={child.id} style={styles.childChip}>
                    <Text style={styles.childChipText}>
                      {child.name} • {sectionCounts.get(child.id) ?? 0}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptySectionText}>No subsections yet.</Text>
            )}
          </View>
        );
      })}

      <Modal animationType="slide" transparent visible={isSectionDialogVisible} onRequestClose={resetSectionDialog}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Build store section</Text>
            <TextInput
              onChangeText={setSectionName}
              placeholder="Section name"
              style={styles.input}
              value={sectionName}
            />

            <ScrollView contentContainerStyle={styles.typeRow} horizontal showsHorizontalScrollIndicator={false}>
              <Pressable
                onPress={() => setParentSectionId(null)}
                style={[styles.typeChip, parentSectionId === null ? styles.typeChipSelected : null]}>
                <Text style={[styles.typeChipText, parentSectionId === null ? styles.typeChipTextSelected : null]}>
                  Root section
                </Text>
              </Pressable>
              {rootSections.map((section) => (
                <Pressable
                  key={section.id}
                  onPress={() => setParentSectionId(section.id)}
                  style={[styles.typeChip, parentSectionId === section.id ? styles.typeChipSelected : null]}>
                  <Text style={[styles.typeChipText, parentSectionId === section.id ? styles.typeChipTextSelected : null]}>
                    {section.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.typeRow} horizontal showsHorizontalScrollIndicator={false}>
              {SECTION_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => toggleSectionType(type)}
                  style={[styles.typeChip, selectedSectionTypes.includes(type) ? styles.typeChipSelected : null]}>
                  <Text style={[styles.typeChipText, selectedSectionTypes.includes(type) ? styles.typeChipTextSelected : null]}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.dialogActions}>
              <Pressable onPress={resetSectionDialog} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void handleCreateSection()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addSectionButton: {
    alignItems: 'center',
    backgroundColor: '#A9463C',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addSectionButtonText: {
    color: '#FFF7F1',
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#A9463C',
    borderRadius: 18,
    marginTop: 18,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#FFF7F1',
    fontWeight: '800',
  },
  childChip: {
    backgroundColor: '#F6EADF',
    borderColor: '#E7D5C4',
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  childChipText: {
    color: '#5C4638',
    fontSize: 12,
    fontWeight: '700',
  },
  childrenWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dialog: {
    backgroundColor: '#FFF9F4',
    borderRadius: 28,
    padding: 18,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  dialogTitle: {
    color: '#2F241D',
    fontSize: 20,
    fontWeight: '900',
  },
  emptySectionText: {
    color: '#8A7260',
    fontSize: 12,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFF9F4',
    borderColor: '#E7D5C4',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  overlay: {
    backgroundColor: 'rgba(25,17,12,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#A9463C',
    borderRadius: 16,
    flex: 1,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFF7F1',
    fontWeight: '800',
  },
  screen: {
    backgroundColor: '#F3E6DB',
    flexGrow: 1,
    padding: 18,
    paddingBottom: 40,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#EFE1D6',
    borderRadius: 16,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#5C4638',
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#FFF9F4',
    borderRadius: 22,
    marginTop: 12,
    padding: 14,
  },
  sectionCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionCardMeta: {
    color: '#8A7260',
    fontSize: 12,
    marginTop: 4,
  },
  sectionCardTitle: {
    color: '#2F241D',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  sectionsMeta: {
    color: '#8A7260',
    fontSize: 12,
    marginTop: 4,
    maxWidth: 220,
  },
  sectionsTitle: {
    color: '#2F241D',
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: '#7F6755',
    fontSize: 14,
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#FFF9F4',
    borderRadius: 22,
    flex: 1,
    padding: 16,
  },
  summaryLabel: {
    color: '#8A7260',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  summaryValue: {
    color: '#2F241D',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
  },
  title: {
    color: '#2F241D',
    fontSize: 26,
    fontWeight: '900',
  },
  typeChip: {
    backgroundColor: '#F6EADF',
    borderColor: '#E7D5C4',
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  typeChipSelected: {
    backgroundColor: '#A9463C',
    borderColor: '#A9463C',
  },
  typeChipText: {
    color: '#5C4638',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  typeChipTextSelected: {
    color: '#FFF7F1',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
});
