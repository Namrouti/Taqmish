import { forwardRef, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { FirebaseError } from 'firebase/app';
import { push, ref as databaseRef, set, update } from 'firebase/database';

import { LuxuryTheme } from '@/constants/theme';
import { app, database } from '@/lib/firebase';
import type { CapturedType, DisplaySection } from '@/types/closet';
import {
  capturedTypes,
  classifyItemType,
  DEFAULT_STYLE_TAGS,
  extractImagePalette,
  getBodyPartForType,
  getPlaceholderColors,
  resolveImageUri,
} from '@/utils/closet-helpers';

export type ItemCaptureDialogRef = {
  open: () => void;
};

type ItemCaptureDialogProps = {
  sections: DisplaySection[];
  userId: string;
};

export const ItemCaptureDialog = forwardRef<ItemCaptureDialogRef, ItemCaptureDialogProps>(
  function ItemCaptureDialog({ sections, userId }, ref) {
    const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
    const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
    const [capturedMimeType, setCapturedMimeType] = useState<string>('image/jpeg');
    const [capturedType, setCapturedType] = useState<CapturedType>('Accessories');
    const [dominantColors, setDominantColors] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedStyleTags, setSelectedStyleTags] = useState<string[]>(['casual']);

    const closeDialog = () => {
      if (isSaving) return;
      setIsVisible(false);
      setCapturedImageUri(null);
      setCapturedBase64(null);
      setCapturedMimeType('image/jpeg');
      setCapturedType('Accessories');
      setDominantColors([]);
      setSelectedSectionId(null);
      setSelectedStyleTags(['casual']);
    };

    const toggleStyleTag = (tag: string) => {
      setSelectedStyleTags((current) => {
        if (current.includes(tag)) {
          if (current.length === 1) return current;
          return current.filter((entry) => entry !== tag);
        }
        return [...current, tag];
      });
    };

    const processSelectedAsset = async (asset: ImagePicker.ImagePickerAsset) => {
      const predictedType = classifyItemType(asset.width, asset.height);
      const extractedColors = asset.base64
        ? await extractImagePalette(asset.base64)
        : [];
      setCapturedImageUri(asset.uri);
      setCapturedBase64(asset.base64 ?? null);
      setCapturedMimeType(asset.mimeType ?? 'image/jpeg');
      setCapturedType(predictedType);
      setDominantColors(extractedColors.length ? extractedColors : getPlaceholderColors(predictedType));
      const defaultSection =
        sections.find((s) => s.types.includes(predictedType) && s.level > 0) ??
        sections.find((s) => s.types.includes(predictedType)) ??
        null;
      setSelectedSectionId(defaultSection?.id ?? null);
      setIsVisible(true);
    };

    const openCamera = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('يرجى السماح باستخدام الكاميرا أولاً.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        cameraType: ImagePicker.CameraType.back,
        mediaTypes: ['images'],
        quality: 0.9,
      });
      if (result.canceled || result.assets.length === 0) return;
      await processSelectedAsset(result.assets[0]);
    };

    const openPhotoLibrary = async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('يرجى السماح بالوصول إلى الصور أولاً.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        mediaTypes: ['images'],
        quality: 0.9,
        selectionLimit: 1,
      });
      if (result.canceled || result.assets.length === 0) return;
      await processSelectedAsset(result.assets[0]);
    };

    const openUploadChoice = () => {
      if (isSaving) return;
      Alert.alert('Add to My Clothes', 'Choose how you want to add the item.', [
        { text: 'Camera', onPress: () => void openCamera() },
        { text: 'Phone Gallery', onPress: () => void openPhotoLibrary() },
        { style: 'cancel', text: 'Cancel' },
      ]);
    };

    const saveCapturedPiece = async () => {
      if (!capturedImageUri) {
        Alert.alert('التقط صورة أولاً ثم حاول الحفظ.');
        return;
      }

      setIsSaving(true);

      try {
        console.log('[save] start — uid:', userId, 'uri:', capturedImageUri, 'mime:', capturedMimeType);

        // Step 1: reserve the item ID in Realtime Database
        const recordRef = push(databaseRef(database, `SiteClosets/${userId}`));
        const id = recordRef.key;
        if (!id) throw new Error('Unable to create item id.');
        console.log('[save] DB ref created — id:', id);

        const section = sections.find((entry) => entry.id === selectedSectionId) ?? null;

        const normalizedPayload = {
          age: 'غير محدد',
          bodyPart: getBodyPartForType(capturedType),
          bodyPartKey:
            capturedType === 'Top'
              ? 'top'
              : capturedType === 'Bottom'
                ? 'bottom'
                : capturedType === 'Shoes'
                  ? 'shoes'
                  : capturedType === 'Bag'
                    ? 'bag'
                    : 'accessory',
          closetSectionId: section?.id,
          closetSectionName: section?.name,
          closetSectionPath: section?.pathLabel,
          colors: dominantColors,
          filePath: '',
          id,
          mainClass: 'Camera',
          ownerId: userId,
          seasonTags: [],
          sex: 'غير محدد',
          size: 'غير محدد',
          source: 'user',
          styleTags: selectedStyleTags,
          subParts: capturedType,
          subType: capturedType,
          title: capturedType,
        };

        await Promise.all([
          set(recordRef, normalizedPayload),
          set(databaseRef(database, `userClosetItems/${userId}/${id}`), normalizedPayload),
        ]);
        console.log('[save] DB records written');

        // Step 2: store the image as a base64 data URL directly in the database
        if (capturedBase64) {
          const mimeType = capturedMimeType || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${capturedBase64}`;
          await Promise.all([
            update(databaseRef(database, `SiteClosets/${userId}/${id}`), { filePath: dataUrl }),
            update(databaseRef(database, `userClosetItems/${userId}/${id}`), { filePath: dataUrl }),
          ]);
          console.log('[save] DB filePath updated with base64 data URL');
        }

        closeDialog();
        Alert.alert('تم حفظ القطعة بنجاح.');
      } catch (error) {
        console.error('[save] FAILED:', error);

        const isError = error instanceof Error;
        const firebaseError = error as FirebaseError & {
          customData?: { serverResponse?: string };
          serverResponse?: string;
        };

        // Extract first meaningful stack line (skips internal noise)
        const stackLine = isError && error.stack
          ? (error.stack.split('\n').find((l) => l.includes('.tsx') || l.includes('.ts') || l.includes('.js')) ?? '')
              .trim()
          : '';

        const isFirebaseSide = Boolean(firebaseError.code); // firebase errors always have a code

        const lines = [
          `Type: ${isFirebaseSide ? 'Firebase' : 'Code'}`,
          firebaseError.code ? `Code: ${firebaseError.code}` : null,
          isError ? `Message: ${error.message}` : `Raw: ${String(error)}`,
          firebaseError.customData?.serverResponse ?? firebaseError.serverResponse
            ? `Server: ${firebaseError.customData?.serverResponse ?? firebaseError.serverResponse}`
            : null,
          stackLine ? `At: ${stackLine}` : null,
          `bucket: ${app.options.storageBucket ?? 'unknown'}`,
          `project: ${app.options.projectId ?? 'unknown'}`,
          `uid: ${userId}`,
        ].filter(Boolean);

        console.error('[save] alert details:\n', lines.join('\n'));
        Alert.alert('فشل حفظ القطعة.', lines.join('\n'));
      } finally {
        setIsSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({ open: openUploadChoice }));

    return (
      <Modal
        animationType="fade"
        transparent
        visible={isVisible}
        onRequestClose={closeDialog}>
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={closeDialog} />
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Save to My Clothes</Text>
            <Text style={styles.dialogSubtitle}>
              Preview the captured piece, confirm its type, then save it to `SiteClosets`.
            </Text>

            {capturedImageUri ? (
              <View style={styles.previewSection}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewHeaderTitle}>Processed preview</Text>
                  <Text style={styles.previewHeaderMeta}>Prepared preview</Text>
                </View>
                <View style={styles.previewWrap}>
                  <View style={styles.previewCheckerboard}>
                    <View style={styles.previewCheckerRow}>
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                    </View>
                    <View style={styles.previewCheckerRow}>
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                    </View>
                    <View style={styles.previewCheckerRow}>
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                    </View>
                    <View style={styles.previewCheckerRow}>
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                    </View>
                  </View>
                  <Image
                    source={{ uri: resolveImageUri(capturedImageUri)! }}
                    style={styles.previewImage}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.previewNote}>Auto-cropped preview ready for saving.</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detected type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  {capturedTypes.map((type) => {
                    const selected = capturedType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => {
                          setCapturedType(type);
                          const matchingSection =
                            sections.find((s) => s.types.includes(type) && s.level > 0) ??
                            sections.find((s) => s.types.includes(type)) ??
                            null;
                          setSelectedSectionId(matchingSection?.id ?? null);
                        }}
                        style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                        <Text
                          style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Closet section</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  <Pressable
                    onPress={() => setSelectedSectionId(null)}
                    style={[styles.typeChip, selectedSectionId === null ? styles.typeChipSelected : null]}>
                    <Text
                      style={[styles.typeChipText, selectedSectionId === null ? styles.typeChipTextSelected : null]}>
                      No section
                    </Text>
                  </Pressable>
                  {sections.map((section) => {
                    const selected = selectedSectionId === section.id;
                    return (
                      <Pressable
                        key={section.id}
                        onPress={() => setSelectedSectionId(section.id)}
                        style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                        <Text
                          style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>
                          {section.pathLabel}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Style tags</Text>
              <View style={styles.typeRowWrap}>
                {DEFAULT_STYLE_TAGS.map((tag) => {
                  const selected = selectedStyleTags.includes(tag);
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dominant colors</Text>
              <View style={styles.colorsRow}>
                {dominantColors.map((color, colorIndex) => (
                  <View
                    key={`${color}-${colorIndex}`}
                    style={[styles.colorSwatch, { backgroundColor: color }]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.dialogActions}>
              <Pressable
                disabled={isSaving}
                onPress={closeDialog}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && !isSaving ? styles.buttonPressed : null,
                  isSaving ? styles.buttonDisabled : null,
                ]}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={isSaving}
                onPress={() => void openCamera()}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && !isSaving ? styles.buttonPressed : null,
                  isSaving ? styles.buttonDisabled : null,
                ]}>
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </Pressable>
              <Pressable
                disabled={isSaving}
                onPress={() => void saveCapturedPiece()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !isSaving ? styles.buttonPressed : null,
                  isSaving ? styles.buttonDisabled : null,
                ]}>
                {isSaving ? (
                  <ActivityIndicator color={LuxuryTheme.textStrong} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save piece</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
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
  previewCheckerCell: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    flex: 1,
  },
  previewCheckerCellDark: {
    backgroundColor: LuxuryTheme.cardAlt,
  },
  previewCheckerRow: {
    flex: 1,
    flexDirection: 'row',
  },
  previewCheckerboard: {
    ...StyleSheet.absoluteFillObject,
  },
  previewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  previewHeaderMeta: {
    color: LuxuryTheme.textStrong,
    fontSize: 11,
    fontWeight: '700',
  },
  previewHeaderTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 14,
    fontWeight: '800',
  },
  previewImage: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  previewNote: {
    color: LuxuryTheme.textStrong,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  previewSection: {
    marginTop: 2,
  },
  previewWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    height: 220,
    marginTop: 10,
    overflow: 'hidden',
    padding: 10,
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
