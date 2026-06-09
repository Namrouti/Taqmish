import { useMemo, useState } from 'react';
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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import jpeg from 'jpeg-js';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { push, ref as databaseRef } from 'firebase/database';

import { database, storage } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';
import { useStoreItems } from '@/hooks/use-store-items';
import { useStoreSections } from '@/hooks/use-store-sections';

const STYLE_TAGS = ['casual', 'formal', 'evening', 'sport'];
const TYPE_TAGS = ['Top', 'Bottom', 'Shoes', 'Accessories', 'Bag', 'Hat', 'Watch'];
const SEASON_TAGS = ['spring', 'summer', 'autumn', 'winter'];
const GENDER_TAGS = ['all', 'male', 'female'];

type ProductAsset = {
  base64?: string | null;
  uri: string;
};

function rgbToHex(red: number, green: number, blue: number) {
  return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue
    .toString(16)
    .padStart(2, '0')}`.toUpperCase();
}

function quantizeColor(value: number, step = 32) {
  return Math.min(255, Math.round(value / step) * step);
}

async function extractImagePalette(base64: string) {
  const response = await fetch(`data:image/jpeg;base64,${base64}`);
  const arrayBuffer = await response.arrayBuffer();
  const decoded = jpeg.decode(new Uint8Array(arrayBuffer), { useTArray: true });
  const counts = new Map<string, number>();
  const step = Math.max(1, Math.floor(Math.sqrt((decoded.width * decoded.height) / 2500)));

  for (let y = 0; y < decoded.height; y += step) {
    for (let x = 0; x < decoded.width; x += step) {
      const index = (y * decoded.width + x) * 4;
      const red = decoded.data[index];
      const green = decoded.data[index + 1];
      const blue = decoded.data[index + 2];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);

      if (max < 20 || (max > 245 && max - min < 10)) {
        continue;
      }

      const key = rgbToHex(quantizeColor(red), quantizeColor(green), quantizeColor(blue));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([color]) => color)
    .slice(0, 8);
}

function buildSku(title: string, type: string) {
  return `${type.slice(0, 3).toUpperCase()}-${title.replace(/\s+/g, '-').slice(0, 12).toUpperCase()}`;
}

export default function ProductsScreen() {
  const { authUser, storeProfile } = useAuth();
  const { inventoryCount, items, lowStockCount, publishedCount, saveItem } = useStoreItems(authUser?.uid);
  const { sections } = useStoreSections(authUser?.uid);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sizes, setSizes] = useState('');
  const [selectedType, setSelectedType] = useState('Top');
  const [selectedTags, setSelectedTags] = useState<string[]>(['casual']);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(['summer']);
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<ProductAsset[]>([]);
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => (left.title ?? '').localeCompare(right.title ?? '')),
    [items]
  );

  if (!authUser) {
    return <Redirect href="/login" />;
  }

  const resetDialog = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setStock('');
    setSizes('');
    setSelectedType('Top');
    setSelectedTags(['casual']);
    setSelectedSeasons(['summer']);
    setSelectedGender('all');
    setSelectedSectionId(null);
    setSelectedAssets([]);
    setDetectedColors([]);
    setDialogVisible(false);
    setIsSaving(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    );
  };

  const toggleSeason = (season: string) => {
    setSelectedSeasons((current) =>
      current.includes(season) ? current.filter((entry) => entry !== season) : [...current, season]
    );
  };

  const collectColors = async (assets: ProductAsset[]) => {
    const palettes = await Promise.all(
      assets.map(async (asset) => (asset.base64 ? extractImagePalette(asset.base64) : []))
    );
    return Array.from(new Set(palettes.flat())).slice(0, 8);
  };

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: true,
      base64: true,
      mediaTypes: ['images'],
      quality: 0.85,
      selectionLimit: 5,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const nextAssets = result.assets.map((asset) => ({
      base64: asset.base64,
      uri: asset.uri,
    }));
    setSelectedAssets(nextAssets);
    setDetectedColors(await collectColors(nextAssets));
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Products', 'Allow camera access first.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      base64: true,
      cameraType: ImagePicker.CameraType.back,
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const nextAssets = result.assets.map((asset) => ({
      base64: asset.base64,
      uri: asset.uri,
    }));
    setSelectedAssets(nextAssets);
    setDetectedColors(await collectColors(nextAssets));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Products', 'Enter a product title first.');
      return;
    }

    if (!selectedAssets.length) {
      Alert.alert('Products', 'Add at least one image for the product.');
      return;
    }

    setIsSaving(true);

    try {
      const productRef = push(databaseRef(database, `StoreItems/${authUser.uid}`));
      const id = productRef.key;

      if (!id) {
        throw new Error('Unable to create product id.');
      }

      const uploadedUrls: string[] = [];
      for (let index = 0; index < selectedAssets.length; index += 1) {
        const asset = selectedAssets[index];
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const imageRef = storageRef(storage, `StoreItems/${authUser.uid}/${id}-${index}.jpg`);
        await uploadBytes(imageRef, blob, { contentType: 'image/jpeg' });
        uploadedUrls.push(await getDownloadURL(imageRef));
      }

      const section = sections.find((entry) => entry.id === selectedSectionId) ?? null;
      const sizeOptions = sizes
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      await saveItem({
        bodyPart: selectedType,
        bodyPartKey: selectedType.toLowerCase(),
        colors: detectedColors,
        createdAt: new Date().toISOString(),
        currency: 'ILS',
        description: description.trim(),
        filePath: uploadedUrls[0],
        genderKey: selectedGender,
        id,
        images: uploadedUrls,
        ownerId: authUser.uid,
        price: price.trim() ? Number(price) : undefined,
        seasonTags: selectedSeasons,
        sectionId: section?.id,
        sectionName: section?.name,
        sectionPath: section?.pathLabel,
        sizeOptions,
        sku: buildSku(title.trim(), selectedType),
        source: 'store',
        status: 'published',
        stock: stock.trim() ? Number(stock) : 0,
        storeId: authUser.uid,
        storeName: storeProfile?.storeName,
        styleTags: selectedTags,
        subParts: selectedType,
        subType: selectedType,
        title: title.trim(),
      });

      resetDialog();
    } catch (error) {
      Alert.alert('Products', error instanceof Error ? error.message : 'Unable to save product.');
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Products</Text>
        <Pressable onPress={() => setDialogVisible(true)} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Published</Text>
          <Text style={styles.summaryValue}>{publishedCount}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Inventory</Text>
          <Text style={styles.summaryValue}>{inventoryCount}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Low stock</Text>
          <Text style={styles.summaryValue}>{lowStockCount}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {sortedItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
              {(item.images?.length ? item.images : item.filePath ? [item.filePath] : []).map((uri, index) => (
                <Image key={`${item.id}-${index}`} source={{ uri }} style={styles.image} contentFit="cover" />
              ))}
            </ScrollView>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>
              {item.subParts ?? 'General'}
              {item.sectionName ? ` • ${item.sectionName}` : ''}
            </Text>
            <Text style={styles.itemMeta}>
              {(item.price ?? 0) > 0 ? `${item.price} ${item.currency ?? 'ILS'}` : 'No price yet'}
              {` • stock ${item.stock ?? 0}`}
            </Text>
            {item.sizeOptions?.length ? (
              <Text style={styles.itemMeta}>Sizes: {item.sizeOptions.join(', ')}</Text>
            ) : null}
            {item.colors?.length ? (
              <View style={styles.colorsRow}>
                {item.colors.map((color, index) => (
                  <View key={`${item.id}-${color}-${index}`} style={[styles.colorSwatch, { backgroundColor: color }]} />
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Modal animationType="slide" transparent visible={isDialogVisible} onRequestClose={resetDialog}>
        <View style={styles.overlay}>
          <ScrollView style={styles.dialog} contentContainerStyle={styles.dialogContent}>
            <Text style={styles.dialogTitle}>Add store product</Text>
            <Text style={styles.dialogSubtitle}>
              Upload or capture product photos, then save inventory-ready data compatible with Taqmish Expo.
            </Text>

            <View style={styles.mediaActionsRow}>
              <Pressable onPress={() => void handleTakePhoto()} style={styles.mediaActionButton}>
                <Text style={styles.mediaActionText}>Take photo</Text>
              </Pressable>
              <Pressable onPress={() => void handlePickImages()} style={styles.mediaActionButton}>
                <Text style={styles.mediaActionText}>Upload images</Text>
              </Pressable>
            </View>

            {selectedAssets.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
                {selectedAssets.map((asset, index) => (
                  <Image key={`${asset.uri}-${index}`} source={{ uri: asset.uri }} style={styles.previewImage} contentFit="cover" />
                ))}
              </ScrollView>
            ) : null}

            <TextInput onChangeText={setTitle} placeholder="Product title" style={styles.input} value={title} />
            <TextInput onChangeText={setDescription} placeholder="Description" style={[styles.input, styles.multilineInput]} value={description} multiline />
            <TextInput onChangeText={setPrice} placeholder="Price" style={styles.input} value={price} keyboardType="decimal-pad" />
            <TextInput onChangeText={setStock} placeholder="Inventory count" style={styles.input} value={stock} keyboardType="number-pad" />
            <TextInput onChangeText={setSizes} placeholder="Sizes separated by comma: S, M, L" style={styles.input} value={sizes} />

            <ScrollView contentContainerStyle={styles.pillsRow} horizontal showsHorizontalScrollIndicator={false}>
              {TYPE_TAGS.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[styles.pill, selectedType === type ? styles.pillSelected : null]}>
                  <Text style={[styles.pillText, selectedType === type ? styles.pillTextSelected : null]}>{type}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.pillsRow} horizontal showsHorizontalScrollIndicator={false}>
              {STYLE_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.pill, selectedTags.includes(tag) ? styles.pillSelected : null]}>
                  <Text style={[styles.pillText, selectedTags.includes(tag) ? styles.pillTextSelected : null]}>{tag}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.pillsRow} horizontal showsHorizontalScrollIndicator={false}>
              {SEASON_TAGS.map((season) => (
                <Pressable
                  key={season}
                  onPress={() => toggleSeason(season)}
                  style={[styles.pill, selectedSeasons.includes(season) ? styles.pillSelected : null]}>
                  <Text style={[styles.pillText, selectedSeasons.includes(season) ? styles.pillTextSelected : null]}>{season}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.pillsRow} horizontal showsHorizontalScrollIndicator={false}>
              {GENDER_TAGS.map((gender) => (
                <Pressable
                  key={gender}
                  onPress={() => setSelectedGender(gender)}
                  style={[styles.pill, selectedGender === gender ? styles.pillSelected : null]}>
                  <Text style={[styles.pillText, selectedGender === gender ? styles.pillTextSelected : null]}>{gender}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.pillsRow} horizontal showsHorizontalScrollIndicator={false}>
              <Pressable
                onPress={() => setSelectedSectionId(null)}
                style={[styles.pill, selectedSectionId === null ? styles.pillSelected : null]}>
                <Text style={[styles.pillText, selectedSectionId === null ? styles.pillTextSelected : null]}>No section</Text>
              </Pressable>
              {sections.map((section) => (
                <Pressable
                  key={section.id}
                  onPress={() => setSelectedSectionId(section.id)}
                  style={[styles.pill, selectedSectionId === section.id ? styles.pillSelected : null]}>
                  <Text style={[styles.pillText, selectedSectionId === section.id ? styles.pillTextSelected : null]}>
                    {section.pathLabel ?? section.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {detectedColors.length ? (
              <View style={styles.colorsWrap}>
                <Text style={styles.colorsTitle}>Auto extracted colors</Text>
                <View style={styles.colorsRow}>
                  {detectedColors.map((color, index) => (
                    <View key={`${color}-${index}`} style={[styles.colorSwatch, { backgroundColor: color }]} />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <Pressable onPress={resetDialog} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable disabled={isSaving} onPress={() => void handleSave()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  addButton: {
    backgroundColor: '#A9463C',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#FFF7F1',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFF9F4',
    borderRadius: 24,
    padding: 12,
  },
  colorSwatch: {
    borderColor: '#D8C2B1',
    borderRadius: 10,
    borderWidth: 1,
    height: 24,
    marginRight: 8,
    width: 36,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorsTitle: {
    color: '#5C4638',
    fontSize: 13,
    fontWeight: '800',
  },
  colorsWrap: {
    marginTop: 14,
  },
  dialog: {
    backgroundColor: '#FFF9F4',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  dialogContent: {
    paddingBottom: 28,
  },
  dialogSubtitle: {
    color: '#8A7260',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  dialogTitle: {
    color: '#2F241D',
    fontSize: 20,
    fontWeight: '900',
  },
  galleryRow: {
    gap: 10,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  image: {
    backgroundColor: '#F2E2D6',
    borderRadius: 18,
    height: 150,
    width: 132,
  },
  input: {
    backgroundColor: '#F6EADF',
    borderColor: '#E7D5C4',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemMeta: {
    color: '#8A7260',
    fontSize: 12,
    marginTop: 5,
  },
  itemTitle: {
    color: '#2F241D',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  list: {
    gap: 12,
    paddingBottom: 40,
  },
  mediaActionButton: {
    alignItems: 'center',
    backgroundColor: '#EFE1D6',
    borderRadius: 16,
    flex: 1,
    paddingVertical: 12,
  },
  mediaActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  mediaActionText: {
    color: '#5C4638',
    fontWeight: '800',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  overlay: {
    backgroundColor: 'rgba(25,17,12,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  pill: {
    backgroundColor: '#F6EADF',
    borderColor: '#E7D5C4',
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillSelected: {
    backgroundColor: '#A9463C',
    borderColor: '#A9463C',
  },
  pillText: {
    color: '#5C4638',
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextSelected: {
    color: '#FFF7F1',
  },
  pillsRow: {
    paddingTop: 12,
  },
  previewImage: {
    backgroundColor: '#F2E2D6',
    borderRadius: 18,
    height: 100,
    width: 96,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#A9463C',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFF7F1',
    fontWeight: '800',
  },
  screen: {
    backgroundColor: '#F3E6DB',
    flex: 1,
    padding: 18,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#EFE1D6',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#5C4638',
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#FFF9F4',
    borderRadius: 22,
    flex: 1,
    padding: 14,
  },
  summaryLabel: {
    color: '#8A7260',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryValue: {
    color: '#2F241D',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },
  title: {
    color: '#2F241D',
    fontSize: 26,
    fontWeight: '900',
  },
});
