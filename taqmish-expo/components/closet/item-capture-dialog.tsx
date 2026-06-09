import { forwardRef, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { FirebaseError } from 'firebase/app';
import { getDownloadURL, getMetadata, getStorage as getFirebaseStorage, ref as storageRef } from 'firebase/storage';
import { push, ref as databaseRef, set } from 'firebase/database';

import { LuxuryTheme } from '@/constants/theme';
import { app, database } from '@/lib/firebase';
import type { ClosetItem } from '@/hooks/use-closet-items';
import type { CapturedType, DisplaySection } from '@/types/closet';
import {
  buildAutoCropRect,
  buildStorageBucketCandidates,
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
  getIdToken: () => Promise<string>;
  sections: DisplaySection[];
  userId: string;
};

export const ItemCaptureDialog = forwardRef<ItemCaptureDialogRef, ItemCaptureDialogProps>(
  function ItemCaptureDialog({ getIdToken, sections, userId }, ref) {
    const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
    const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
    const [capturedType, setCapturedType] = useState<CapturedType>('Accessories');
    const [dominantColors, setDominantColors] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isProcessingCapture, setProcessingCapture] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedStyleTags, setSelectedStyleTags] = useState<string[]>(['casual']);

    const closeDialog = () => {
      if (isSaving) return;
      setIsVisible(false);
      setCapturedImageUri(null);
      setCapturedImageBase64(null);
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
      const hasDimensions = Boolean(asset.width && asset.height);

      setProcessingCapture(true);

      try {
        let processedUri = asset.uri;
        let processedBase64 = asset.base64 ?? null;

        if (hasDimensions) {
          const crop = buildAutoCropRect(predictedType, asset.width!, asset.height!);
          const manipulated = await manipulateAsync(asset.uri, [{ crop }], {
            base64: true,
            compress: 0.92,
            format: SaveFormat.JPEG,
          });
          processedUri = manipulated.uri;
          processedBase64 = manipulated.base64 ?? processedBase64;
          const extractedColors = manipulated.base64
            ? await extractImagePalette(manipulated.base64)
            : [];
          setDominantColors(
            extractedColors.length ? extractedColors : getPlaceholderColors(predictedType)
          );
        } else {
          const extractedColors = asset.base64
            ? await extractImagePalette(asset.base64)
            : [];
          setDominantColors(
            extractedColors.length ? extractedColors : getPlaceholderColors(predictedType)
          );
        }

        setCapturedImageUri(processedUri);
        setCapturedImageBase64(processedBase64);
        setCapturedType(predictedType);
        const defaultSection =
          sections.find((s) => s.types.includes(predictedType) && s.level > 0) ??
          sections.find((s) => s.types.includes(predictedType)) ??
          null;
        setSelectedSectionId(defaultSection?.id ?? null);
        setIsVisible(true);
      } catch (error) {
        Alert.alert(
          'Auto crop fallback',
          error instanceof Error ? error.message : 'Using the original captured image instead.'
        );
        const fallback = await manipulateAsync(asset.uri, [], {
          base64: true,
          compress: 0.92,
          format: SaveFormat.JPEG,
        });
        setCapturedImageUri(fallback.uri);
        setCapturedImageBase64(fallback.base64 ?? asset.base64 ?? null);
        setCapturedType(predictedType);
        setDominantColors(getPlaceholderColors(predictedType));
        const defaultSection =
          sections.find((s) => s.types.includes(predictedType) && s.level > 0) ??
          sections.find((s) => s.types.includes(predictedType)) ??
          null;
        setSelectedSectionId(defaultSection?.id ?? null);
        setIsVisible(true);
      } finally {
        setProcessingCapture(false);
      }
    };

    const openCamera = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('يرجى السماح باستخدام الكاميرا أولاً.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
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
        allowsEditing: true,
        base64: true,
        mediaTypes: ['images'],
        quality: 0.9,
        selectionLimit: 1,
      });
      if (result.canceled || result.assets.length === 0) return;
      await processSelectedAsset(result.assets[0]);
    };

    const openUploadChoice = () => {
      if (isProcessingCapture || isSaving) return;
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
        const recordRef = push(databaseRef(database, `SiteClosets/${userId}`));
        const id = recordRef.key;
        if (!id) throw new Error('Unable to create item id.');

        const objectPath = `SiteClosets/${userId}/${id}.jpg`;
        const fileInfo = await FileSystem.getInfoAsync(capturedImageUri);
        if (!fileInfo.exists || !fileInfo.size) {
          throw new Error('Unable to read the local image file for upload.');
        }

        const idToken = await getIdToken();
        const storageBuckets = buildStorageBucketCandidates(
          app.options.projectId,
          app.options.storageBucket
        );
        if (!storageBuckets.length) {
          throw new Error('Firebase Storage bucket is missing from app configuration.');
        }

        let activeBucket: string | null = null;
        let uploadFailureDetails = '';

        for (const storageBucket of storageBuckets) {
          const startResponse = await fetch(
            `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(storageBucket)}/o?name=${encodeURIComponent(objectPath)}`,
            {
              body: JSON.stringify({ contentType: 'image/jpeg', name: objectPath }),
              headers: {
                Authorization: `Firebase ${idToken}`,
                'Content-Type': 'application/json; charset=utf-8',
                'X-Firebase-GMPID': app.options.appId ?? '',
                'X-Goog-Upload-Command': 'start',
                'X-Goog-Upload-Header-Content-Length': String(fileInfo.size),
                'X-Goog-Upload-Header-Content-Type': 'image/jpeg',
                'X-Goog-Upload-Protocol': 'resumable',
              },
              method: 'POST',
            }
          );

          if (!startResponse.ok) {
            const body = await startResponse.text();
            uploadFailureDetails = `Bucket ${storageBucket}: [${startResponse.status}] ${body || 'No server response.'}`;
            continue;
          }

          const uploadUrl = startResponse.headers.get('X-Goog-Upload-URL');
          if (!uploadUrl) {
            const body = await startResponse.text();
            uploadFailureDetails = `Bucket ${storageBucket}: missing upload URL. ${body || 'No server response.'}`;
            continue;
          }

          const uploadResult = await FileSystem.uploadAsync(uploadUrl, capturedImageUri, {
            fieldName: 'file',
            headers: {
              'Content-Type': 'image/jpeg',
              'X-Goog-Upload-Command': 'upload, finalize',
              'X-Goog-Upload-Offset': '0',
            },
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          });

          if (uploadResult.status < 200 || uploadResult.status >= 300) {
            uploadFailureDetails = `Bucket ${storageBucket}: [${uploadResult.status}] ${uploadResult.body || 'No server response.'}`;
            continue;
          }

          activeBucket = storageBucket;
          break;
        }

        if (!activeBucket) {
          throw new Error(
            `Firebase Storage upload failed. ${uploadFailureDetails || 'No bucket accepted the upload request.'}`
          );
        }

        const activeStorage = getFirebaseStorage(app, `gs://${activeBucket}`);
        const imageRef = storageRef(activeStorage, objectPath);
        const uploadedMetadata = await getMetadata(imageRef);
        if (!uploadedMetadata.fullPath || uploadedMetadata.size === 0) {
          throw new Error('Upload verification failed. Firebase Storage returned empty metadata.');
        }
        const downloadUrl = await getDownloadURL(imageRef);
        const section = sections.find((entry) => entry.id === selectedSectionId) ?? null;

        const payload: ClosetItem = {
          age: 'غير محدد',
          bodyPart: getBodyPartForType(capturedType),
          closetSectionId: section?.id,
          closetSectionName: section?.name,
          closetSectionPath: section?.pathLabel,
          colors: dominantColors,
          filePath: downloadUrl,
          id,
          mainClass: 'Camera',
          sex: 'غير محدد',
          size: 'غير محدد',
          subParts: capturedType,
        };

        const normalizedPayload = {
          ...payload,
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
          ownerId: userId,
          seasonTags: [],
          source: 'user',
          styleTags: selectedStyleTags,
          subType: capturedType,
          title: capturedType,
        };

        await Promise.all([
          set(recordRef, normalizedPayload),
          set(databaseRef(database, `userClosetItems/${userId}/${id}`), normalizedPayload),
        ]);

        closeDialog();
        Alert.alert(
          'تم حفظ القطعة بنجاح.',
          `Storage path: ${uploadedMetadata.fullPath}\nBucket: ${activeBucket}`
        );
      } catch (error) {
        const firebaseError = error as FirebaseError & {
          customData?: { serverResponse?: string };
          serverResponse?: string;
        };
        const details = [
          firebaseError.code,
          firebaseError.message,
          firebaseError.customData?.serverResponse ?? firebaseError.serverResponse,
          `projectId: ${app.options.projectId ?? 'unknown'}`,
          `storageBucket: ${app.options.storageBucket ?? 'unknown'}`,
          `uid: ${userId}`,
        ]
          .filter(Boolean)
          .join('\n\n');
        Alert.alert(
          'فشل حفظ القطعة.',
          details || (error instanceof Error ? error.message : 'حاول مرة أخرى.')
        );
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
                          setDominantColors(getPlaceholderColors(type));
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
                disabled={isSaving || isProcessingCapture}
                onPress={() => void openCamera()}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && !isProcessingCapture ? styles.buttonPressed : null,
                  isProcessingCapture ? styles.buttonDisabled : null,
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
    color: LuxuryTheme.textMuted,
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
    color: LuxuryTheme.textMuted,
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
