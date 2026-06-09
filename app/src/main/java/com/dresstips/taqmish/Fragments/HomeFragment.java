package com.dresstips.taqmish.Fragments;

import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.SeekBar;
import android.widget.Spinner;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Adapters.ItemAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.CalendarItem;
import com.dresstips.taqmish.classes.ColorHelper;
import com.dresstips.taqmish.classes.OutfitClass;
import com.dresstips.taqmish.classes.SiteClosets;
import com.dresstips.taqmish.classes.WardrobeImageHelper;
import com.dresstips.taqmish.models.Item;
import com.dresstips.taqmish.repo.ItemRepo;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.squareup.picasso.Picasso;

import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

public class HomeFragment extends Fragment implements ItemAdapter.OnItemClicked {
    private static final List<String> HOME_TYPES = Arrays.asList(
            "Tops", "Bottoms", "Shoes", "Accessories", "Bags", "Watch", "Hat");
    private static final List<String> STYLE_CATEGORIES = Arrays.asList(
            "Casual", "Smart Casual", "Formal", "Sport", "Evening", "Traditional");

    private Switch genderSwitch;
    private ImageButton captureImageButton;
    private ImageView selectedTop, selectedBottom, selectedShoes, selectedWatch, selectedAccessories, selectedHat,
            selectedBag;
    private LinearLayout slotTop, slotBottom, slotShoes, slotWatch, slotAccessories, slotHat, slotBag;
    private TextView outfitStatusText, itemCountText;
    private TextView closetSectionTitle;
    private TextView colorRangeValueText;
    private ProgressBar outfitProgress;
    private SeekBar colorRangeSeekBar;
    private MaterialButton suggestOutfitButton;
    private MaterialButton addToCalendarButton;
    private MaterialButton saveToClosetButton;
    private MaterialButton clearOutfitButton;
    private RecyclerView recyclerView;
    private ChipGroup categoryChipGroup;

    private final List<Item> itemList = new ArrayList<>();
    private final List<Item> filteredList = new ArrayList<>();
    private final List<Item> userItemList = new ArrayList<>();
    private final List<Item> siteItemList = new ArrayList<>();
    private ItemAdapter itemAdapter;
    private ItemRepo itemRepo;

    private Item selectedTopItem;
    private Item selectedBottomItem;
    private Item selectedShoesItem;
    private Item selectedWatchItem;
    private Item selectedAccessoriesItem;
    private Item selectedHatItem;
    private Item selectedBagItem;

    private String currentCategory = "All";
    private int colorRange = 120;

    private AlertDialog addItemDialog;
    private ImageView dialogPreviewImage;
    private EditText dialogItemTitle;
    private Spinner dialogItemTypeSpinner;
    private Spinner dialogItemCategorySpinner;
    private TextView dialogColorsText;
    private ProgressBar dialogSaveProgress;
    private Bitmap pendingOriginalBitmap;
    private Bitmap pendingProcessedBitmap;
    private ArrayList<String> pendingColors = new ArrayList<>();

    private ActivityResultLauncher<Void> cameraLauncher;
    private ActivityResultLauncher<String> galleryLauncher;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        itemRepo = new ItemRepo(requireContext());
        cameraLauncher = registerForActivityResult(new ActivityResultContracts.TakePicturePreview(), result -> {
            if (result != null) {
                handleSelectedBitmap(result);
            }
        });
        galleryLauncher = registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
            if (uri != null) {
                Bitmap bitmap = readBitmapFromUri(uri);
                if (bitmap != null) {
                    handleSelectedBitmap(bitmap);
                }
            }
        });
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home_new_2, container, false);
        initViews(view);
        initListeners();
        initRecyclerView();
        loadData();
        return view;
    }

    private void initViews(View view) {
        genderSwitch = view.findViewById(R.id.genderSwitch);
        captureImageButton = view.findViewById(R.id.captureImageButton);
        selectedTop = view.findViewById(R.id.selectedTop);
        selectedBottom = view.findViewById(R.id.selectedBottom);
        selectedShoes = view.findViewById(R.id.selectedShoes);
        selectedWatch = view.findViewById(R.id.selectedWatch);
        selectedAccessories = view.findViewById(R.id.selectedAccessories);
        selectedHat = view.findViewById(R.id.selectedHat);
        selectedBag = view.findViewById(R.id.selectedBag);
        slotTop = view.findViewById(R.id.slotTop);
        slotBottom = view.findViewById(R.id.slotBottom);
        slotShoes = view.findViewById(R.id.slotShoes);
        slotWatch = view.findViewById(R.id.slotWatch);
        slotAccessories = view.findViewById(R.id.slotAccessories);
        slotHat = view.findViewById(R.id.slotHat);
        slotBag = view.findViewById(R.id.slotBag);
        outfitStatusText = view.findViewById(R.id.outfitStatusText);
        outfitProgress = view.findViewById(R.id.outfitProgress);
        itemCountText = view.findViewById(R.id.itemCountText);
        closetSectionTitle = view.findViewById(R.id.closetSectionTitle);
        colorRangeSeekBar = view.findViewById(R.id.colorRangeSeekBar);
        colorRangeValueText = view.findViewById(R.id.colorRangeValueText);
        suggestOutfitButton = view.findViewById(R.id.suggestOutfitButton);
        addToCalendarButton = view.findViewById(R.id.addToCalendarButton);
        saveToClosetButton = view.findViewById(R.id.saveToClosetButton);
        clearOutfitButton = view.findViewById(R.id.clearOutfitButton);
        recyclerView = view.findViewById(R.id.recyclerView);
        categoryChipGroup = view.findViewById(R.id.categoryChipGroup);
        colorRangeSeekBar.setProgress(colorRange);
        colorRangeValueText.setText(String.valueOf(colorRange));
        updateActionButtons();
    }

    private void initListeners() {
        genderSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            String message = isChecked ? "Female selected" : "Male selected";
            Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
        });

        captureImageButton.setOnClickListener(v -> openAddItemDialog());
        suggestOutfitButton.setOnClickListener(v -> suggestOutfit());
        addToCalendarButton.setOnClickListener(v -> saveOutfitToCalendar());
        saveToClosetButton.setOnClickListener(v -> saveOutfitToCloset());
        clearOutfitButton.setOnClickListener(v -> clearSelectedOutfit());

        colorRangeSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                colorRange = Math.max(0, progress);
                colorRangeValueText.setText(String.valueOf(colorRange));
                applyFilter();
                updateOutfitStatus();
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                Toast.makeText(getContext(), "Color range updated to " + colorRange, Toast.LENGTH_SHORT).show();
            }
        });

        slotTop.setOnClickListener(v -> clearSlotSelection("Tops"));
        slotBottom.setOnClickListener(v -> clearSlotSelection("Bottoms"));
        slotShoes.setOnClickListener(v -> clearSlotSelection("Shoes"));
        slotWatch.setOnClickListener(v -> clearSlotSelection("Watch"));
        slotAccessories.setOnClickListener(v -> clearSlotSelection("Accessories"));
        slotHat.setOnClickListener(v -> clearSlotSelection("Hat"));
        slotBag.setOnClickListener(v -> clearSlotSelection("Bags"));

        categoryChipGroup.setOnCheckedChangeListener((group, checkedId) -> {
            if (checkedId == View.NO_ID) {
                currentCategory = "All";
            } else {
                Chip chip = group.findViewById(checkedId);
                currentCategory = chip == null ? "All" : chip.getText().toString();
            }
            applyFilter();
        });
    }

    private void initRecyclerView() {
        recyclerView.setLayoutManager(new GridLayoutManager(getContext(), 3));
        itemAdapter = new ItemAdapter(filteredList, getContext(), this);
        recyclerView.setAdapter(itemAdapter);
    }

    private void loadData() {
        if (FirebaseAuth.getInstance().getCurrentUser() == null) {
            Toast.makeText(getContext(), "Please login first", Toast.LENGTH_SHORT).show();
            return;
        }

        String uid = FirebaseAuth.getInstance().getCurrentUser().getUid();
        DatabaseReference itemDb = FirebaseDatabase.getInstance().getReference(Item.class.getSimpleName()).child(uid);
        DatabaseReference siteDb = FirebaseDatabase.getInstance().getReference(SiteClosets.class.getSimpleName()).child(uid);

        itemDb.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                userItemList.clear();
                for (DataSnapshot d : snapshot.getChildren()) {
                    Item item = d.getValue(Item.class);
                    if (item != null) {
                        userItemList.add(item);
                    }
                }
                rebuildHomeSourceItems();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Toast.makeText(getContext(), "Failed to load closet items.", Toast.LENGTH_SHORT).show();
            }
        });

        siteDb.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                siteItemList.clear();
                for (DataSnapshot d : snapshot.getChildren()) {
                    SiteClosets siteCloset = d.getValue(SiteClosets.class);
                    if (siteCloset != null) {
                        siteItemList.add(siteClosetToItem(siteCloset));
                    }
                }
                rebuildHomeSourceItems();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Toast.makeText(getContext(), "Failed to load site closet items.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void rebuildHomeSourceItems() {
        itemList.clear();
        if (!siteItemList.isEmpty()) {
            itemList.addAll(siteItemList);
            if (closetSectionTitle != null) {
                closetSectionTitle.setText("SiteClosets");
            }
        } else {
            itemList.addAll(userItemList);
            if (closetSectionTitle != null) {
                closetSectionTitle.setText("My Closet");
            }
        }
        applyFilter();
        updateOutfitStatus();
        updateItemCount();
    }

    private void applyFilter() {
        filteredList.clear();
        Item anchorItem = getSearchAnchorItem();
        for (Item item : itemList) {
            String slot = getSlotForItem(item);
            boolean matchesCategory = "All".equals(currentCategory) || currentCategory.equals(slot);
            if (!matchesCategory) {
                continue;
            }

            if (anchorItem == null || item == anchorItem || isItemWithinSelectedColorRange(anchorItem, item)) {
                filteredList.add(item);
            }
        }
        itemAdapter.updateList(filteredList);
        updateItemCount();
    }

    private Item getSearchAnchorItem() {
        if (selectedTopItem != null) {
            return selectedTopItem;
        }
        if (selectedBottomItem != null) {
            return selectedBottomItem;
        }
        if (selectedShoesItem != null) {
            return selectedShoesItem;
        }
        if (selectedAccessoriesItem != null) {
            return selectedAccessoriesItem;
        }
        if (selectedBagItem != null) {
            return selectedBagItem;
        }
        if (selectedHatItem != null) {
            return selectedHatItem;
        }
        return selectedWatchItem;
    }

    private boolean isItemWithinSelectedColorRange(Item anchorItem, Item candidateItem) {
        List<String> anchorColors = ColorHelper.sanitizeHexColors(anchorItem.getColors());
        List<String> candidateColors = ColorHelper.sanitizeHexColors(candidateItem.getColors());
        if (anchorColors.isEmpty() || candidateColors.isEmpty()) {
            return true;
        }

        for (String anchorColor : anchorColors) {
            for (String candidateColor : candidateColors) {
                if (ColorHelper.isWithinComplementaryRange(anchorColor, candidateColor, colorRange)
                        || ColorHelper.isInColorRange(anchorColor, candidateColor, colorRange)) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    public void onItemClick(Item item) {
        assignSelectedItem(item);
    }

    private void assignSelectedItem(Item item) {
        String slot = getSlotForItem(item);
        if ("Tops".equals(slot)) {
            selectedTopItem = item;
        } else if ("Bottoms".equals(slot)) {
            selectedBottomItem = item;
        } else if ("Shoes".equals(slot)) {
            selectedShoesItem = item;
        } else if ("Accessories".equals(slot)) {
            selectedAccessoriesItem = item;
        } else if ("Bags".equals(slot)) {
            selectedBagItem = item;
        } else if ("Watch".equals(slot)) {
            selectedWatchItem = item;
        } else if ("Hat".equals(slot)) {
            selectedHatItem = item;
        } else if (selectedTopItem == null) {
            selectedTopItem = item;
        } else {
            selectedBottomItem = item;
        }

        updateSelectedViews();
        updateOutfitStatus();
        applyFilter();
    }

    private void clearSlotSelection(String slot) {
        if ("Tops".equals(slot)) {
            selectedTopItem = null;
        } else if ("Bottoms".equals(slot)) {
            selectedBottomItem = null;
        } else if ("Shoes".equals(slot)) {
            selectedShoesItem = null;
        } else if ("Watch".equals(slot)) {
            selectedWatchItem = null;
        } else if ("Accessories".equals(slot)) {
            selectedAccessoriesItem = null;
        } else if ("Hat".equals(slot)) {
            selectedHatItem = null;
        } else if ("Bags".equals(slot)) {
            selectedBagItem = null;
        }

        updateSelectedViews();
        updateOutfitStatus();
        applyFilter();
    }

    private String getSlotForItem(Item item) {
        String type = item.getType() == null ? "" : item.getType().toLowerCase(Locale.ROOT);
        String category = item.getCategory() == null ? "" : item.getCategory().toLowerCase(Locale.ROOT);

        if (type.contains("top") || type.contains("shirt") || type.contains("blouse") || type.contains("jacket")
                || category.contains("upper")) {
            return "Tops";
        }
        if (type.contains("bottom") || type.contains("down") || type.contains("pants") || type.contains("jeans")
                || type.contains("skirt") || type.contains("trouser")) {
            return "Bottoms";
        }
        if (type.contains("shoe") || type.contains("shoos") || type.contains("boot") || type.contains("sneaker")) {
            return "Shoes";
        }
        if (type.contains("bag") || type.contains("purse") || type.contains("backpack")) {
            return "Bags";
        }
        if (type.contains("watch")) {
            return "Watch";
        }
        if (type.contains("accessor") || type.contains("jewel") || type.contains("necklace") || type.contains("ring")
                || type.contains("bracelet")) {
            return "Accessories";
        }
        if (type.contains("hat") || type.contains("cap")) {
            return "Hat";
        }
        return "Tops";
    }

    private void updateSelectedViews() {
        loadItemIntoView(selectedTopItem, selectedTop, slotTop);
        loadItemIntoView(selectedBottomItem, selectedBottom, slotBottom);
        loadItemIntoView(selectedShoesItem, selectedShoes, slotShoes);
        loadItemIntoView(selectedWatchItem, selectedWatch, slotWatch);
        loadItemIntoView(selectedAccessoriesItem, selectedAccessories, slotAccessories);
        loadItemIntoView(selectedHatItem, selectedHat, slotHat);
        loadItemIntoView(selectedBagItem, selectedBag, slotBag);
        updateActionButtons();
    }

    private void loadItemIntoView(Item item, ImageView imageView, LinearLayout slotLayout) {
        if (item != null && !TextUtils.isEmpty(item.getFilePath())) {
            Picasso.with(getContext()).load(item.getFilePath()).fit().centerInside().into(imageView);
            slotLayout.setBackgroundResource(R.drawable.bg_outfit_slot_filled);
        } else {
            imageView.setImageDrawable(null);
            slotLayout.setBackgroundResource(R.drawable.bg_outfit_slot);
        }
    }

    private void updateOutfitStatus() {
        int count = getSelectedCount();
        outfitProgress.setProgress(count);
        updateActionButtons();

        if (count == 0) {
            outfitStatusText.setText("Tap items below to build your outfit");
            outfitStatusText.setTextColor(getResources().getColor(R.color.text_secondary));
            return;
        }

        int harmonyScore = getCurrentHarmonyScore();
        String harmonyLabel = harmonyScore >= 10 ? "Strong color harmony"
                : harmonyScore >= 5 ? "Balanced palette" : "Needs a better match";

        if (count >= 4) {
            outfitStatusText.setText("Outfit ready - " + harmonyLabel);
            outfitStatusText.setTextColor(getResources().getColor(R.color.accent));
        } else {
            outfitStatusText.setText(count + "/7 items selected - " + harmonyLabel);
            outfitStatusText.setTextColor(getResources().getColor(R.color.text_secondary));
        }
    }

    private void updateActionButtons() {
        boolean canSaveOutfit = selectedTopItem != null && selectedBottomItem != null;
        setButtonState(addToCalendarButton, canSaveOutfit);
        setButtonState(saveToClosetButton, canSaveOutfit);
    }

    private void setButtonState(MaterialButton button, boolean enabled) {
        if (button == null) {
            return;
        }
        button.setEnabled(enabled);
        button.setAlpha(enabled ? 1f : 0.45f);
    }

    private void updateItemCount() {
        int total = itemList.size();
        int filtered = filteredList.size();
        if ("All".equals(currentCategory)) {
            itemCountText.setText(total + " items");
        } else {
            itemCountText.setText(filtered + "/" + total + " items");
        }
    }

    private int getSelectedCount() {
        int count = 0;
        if (selectedTopItem != null) count++;
        if (selectedBottomItem != null) count++;
        if (selectedShoesItem != null) count++;
        if (selectedWatchItem != null) count++;
        if (selectedAccessoriesItem != null) count++;
        if (selectedBagItem != null) count++;
        if (selectedHatItem != null) count++;
        return count;
    }

    private int getCurrentHarmonyScore() {
        int score = 0;
        score += scorePair(selectedTopItem, selectedBottomItem);
        score += scorePair(selectedTopItem, selectedShoesItem);
        score += scorePair(selectedBottomItem, selectedShoesItem);
        score += scorePair(selectedTopItem, selectedAccessoriesItem);
        score += scorePair(selectedBottomItem, selectedBagItem);
        return score;
    }

    private int scorePair(Item first, Item second) {
        if (first == null || second == null) {
            return 0;
        }
        return ColorHelper.calculateHarmonyScore(
                ColorHelper.sanitizeHexColors(first.getColors()),
                ColorHelper.sanitizeHexColors(second.getColors()),
                colorRange);
    }

    private void suggestOutfit() {
        if (itemList.isEmpty()) {
            Toast.makeText(getContext(), "No items in your closet yet.", Toast.LENGTH_SHORT).show();
            return;
        }

        clearSelectedOutfit();
        selectedTopItem = pickFirstBySlot("Tops");
        selectedBottomItem = findBestColorMatch("Bottoms", selectedTopItem);
        selectedShoesItem = findBestColorMatch("Shoes", selectedBottomItem != null ? selectedBottomItem : selectedTopItem);
        selectedAccessoriesItem = findBestColorMatch("Accessories", selectedTopItem);
        selectedBagItem = findBestColorMatch("Bags", selectedBottomItem != null ? selectedBottomItem : selectedTopItem);
        selectedHatItem = pickFirstBySlot("Hat");
        selectedWatchItem = pickFirstBySlot("Watch");

        updateSelectedViews();
        updateOutfitStatus();
        Toast.makeText(getContext(), "Outfit suggested based on ColorHelper harmony.", Toast.LENGTH_SHORT).show();
    }

    private Item pickFirstBySlot(String slot) {
        for (Item item : itemList) {
            if (slot.equals(getSlotForItem(item))) {
                return item;
            }
        }
        return null;
    }

    private Item findBestColorMatch(String slot, Item base) {
        Item fallback = pickFirstBySlot(slot);
        if (base == null || base.getColors() == null || base.getColors().isEmpty()) {
            return fallback;
        }

        Item bestMatch = null;
        int bestScore = Integer.MIN_VALUE;
        List<String> baseColors = ColorHelper.sanitizeHexColors(base.getColors());

        for (Item item : itemList) {
            if (!slot.equals(getSlotForItem(item))) {
                continue;
            }

            List<String> candidateColors = ColorHelper.sanitizeHexColors(item.getColors());
            int score = ColorHelper.calculateHarmonyScore(baseColors, candidateColors, colorRange);

            if (candidateColors.isEmpty()) {
                score -= 1;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = item;
            }
        }

        return bestMatch != null ? bestMatch : fallback;
    }

    private void saveOutfitToCalendar() {
        if (!hasMinimumOutfit()) {
            Toast.makeText(getContext(), "Select at least one top and one bottom first.", Toast.LENGTH_SHORT).show();
            return;
        }

        if (FirebaseAuth.getInstance().getCurrentUser() == null) {
            return;
        }

        String uid = FirebaseAuth.getInstance().getCurrentUser().getUid();
        OutfitClass outfit = buildOutfitSnapshot();
        DatabaseReference outfitRef = FirebaseDatabase.getInstance()
                .getReference(OutfitClass.class.getSimpleName())
                .child(uid);
        String outfitId = outfitRef.push().getKey();
        outfit.setId(outfitId);

        outfitRef.child(outfitId).setValue(outfit).addOnCompleteListener(task -> {
            if (!task.isSuccessful()) {
                Toast.makeText(getContext(), "Failed to add outfit to calendar.", Toast.LENGTH_SHORT).show();
                return;
            }

            Calendar now = Calendar.getInstance();
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd-MM-yyyy", Locale.ENGLISH);
            SimpleDateFormat monthFormat = new SimpleDateFormat("MM", Locale.ENGLISH);
            SimpleDateFormat yearFormat = new SimpleDateFormat("yyyy", Locale.ENGLISH);

            CalendarItem calendarItem = new CalendarItem();
            DatabaseReference calRef = FirebaseDatabase.getInstance()
                    .getReference(CalendarItem.class.getSimpleName())
                    .child(uid);
            String calItemId = calRef.push().getKey();
            calendarItem.setItemID(calItemId);
            calendarItem.setTitle("Taqmish Outfit");
            calendarItem.setTime(resolveTimeOfDay(now.get(Calendar.HOUR_OF_DAY)));
            calendarItem.setDate(dateFormat.format(now.getTime()));
            calendarItem.setMonth(monthFormat.format(now.getTime()));
            calendarItem.setYear(yearFormat.format(now.getTime()));
            calendarItem.setOutfitID(outfitId);
            calendarItem.setDay(String.valueOf(now.get(Calendar.DAY_OF_WEEK)));

            calRef.child(calItemId).setValue(calendarItem).addOnSuccessListener(aVoid ->
                    Toast.makeText(getContext(), "Outfit added to calendar!", Toast.LENGTH_SHORT).show());
        });
    }

    private void saveOutfitToCloset() {
        if (!hasMinimumOutfit()) {
            Toast.makeText(getContext(), "Select at least one top and one bottom first.", Toast.LENGTH_SHORT).show();
            return;
        }

        if (FirebaseAuth.getInstance().getCurrentUser() == null) {
            return;
        }

        String uid = FirebaseAuth.getInstance().getCurrentUser().getUid();
        OutfitClass outfit = buildOutfitSnapshot();
        DatabaseReference ref = FirebaseDatabase.getInstance()
                .getReference(OutfitClass.class.getSimpleName())
                .child(uid);
        String outfitId = ref.push().getKey();
        outfit.setId(outfitId);

        ref.child(outfitId).setValue(outfit).addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                Toast.makeText(getContext(), "Outfit saved to your closet!", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(getContext(), "Failed to save outfit.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private OutfitClass buildOutfitSnapshot() {
        OutfitClass outfit = new OutfitClass();
        if (selectedTopItem != null) {
            outfit.setTop(itemToSiteClosets(selectedTopItem, "Top"));
        }
        if (selectedBottomItem != null) {
            outfit.setDown(itemToSiteClosets(selectedBottomItem, "Bottom"));
        }
        if (selectedShoesItem != null) {
            outfit.setShoes(itemToSiteClosets(selectedShoesItem, "Shoes"));
        }
        if (selectedAccessoriesItem != null) {
            outfit.setAccessories(itemToSiteClosets(selectedAccessoriesItem, "Accessories"));
        }
        if (selectedWatchItem != null) {
            outfit.setWatch(itemToSiteClosets(selectedWatchItem, "Watch"));
        }
        if (selectedBagItem != null) {
            outfit.setBag(itemToSiteClosets(selectedBagItem, "Bag"));
        }
        if (selectedHatItem != null) {
            outfit.setHat(itemToSiteClosets(selectedHatItem, "Hat"));
        }
        outfit.setMainClass(getOutfitDescription());
        outfit.setColor(buildColorSummary());
        return outfit;
    }

    private String buildColorSummary() {
        ArrayList<String> summary = new ArrayList<>();
        appendColors(summary, selectedTopItem);
        appendColors(summary, selectedBottomItem);
        appendColors(summary, selectedShoesItem);
        appendColors(summary, selectedAccessoriesItem);
        appendColors(summary, selectedWatchItem);
        appendColors(summary, selectedBagItem);
        appendColors(summary, selectedHatItem);
        return TextUtils.join(",", summary);
    }

    private void appendColors(List<String> summary, Item item) {
        if (item != null && item.getColors() != null) {
            summary.addAll(ColorHelper.sanitizeHexColors(item.getColors()));
        }
    }

    private SiteClosets itemToSiteClosets(Item item, String bodyPart) {
        SiteClosets sc = new SiteClosets();
        sc.setId(item.getId() != null ? item.getId() : item.getItemKey());
        sc.setBodyPart(bodyPart);
        sc.setFilePath(item.getFilePath());
        sc.setColors(ColorHelper.sanitizeHexColors(item.getColors()));
        sc.setMainClass(item.getCategory());
        sc.setSubParts(item.getType());
        sc.setSex(item.getSex());
        return sc;
    }

    private Item siteClosetToItem(SiteClosets siteCloset) {
        Item item = new Item();
        item.setId(siteCloset.getId());
        item.setItemKey(siteCloset.getId());
        item.setFilePath(siteCloset.getFilePath());
        item.setColors(ColorHelper.sanitizeHexColors(siteCloset.getColors()));
        item.setCategory(siteCloset.getMainClass());
        item.setType(resolveTypeFromSiteCloset(siteCloset));
        item.setSex(siteCloset.getSex());
        item.setSource("SiteCloset");

        String title = !TextUtils.isEmpty(siteCloset.getSubParts()) ? siteCloset.getSubParts() : siteCloset.getBodyPart();
        if (TextUtils.isEmpty(title)) {
            title = "Closet Item";
        }
        item.setTitel(title);
        item.setAddDate("site");
        return item;
    }

    private String resolveTypeFromSiteCloset(SiteClosets siteCloset) {
        String bodyPart = siteCloset.getBodyPart() == null ? "" : siteCloset.getBodyPart().toLowerCase(Locale.ROOT);
        String subPart = siteCloset.getSubParts() == null ? "" : siteCloset.getSubParts().toLowerCase(Locale.ROOT);

        if (bodyPart.contains("علوي")) {
            return "Tops";
        }
        if (bodyPart.contains("سفلي")) {
            return "Bottoms";
        }
        if (subPart.contains("حذاء") || subPart.contains("shoe")) {
            return "Shoes";
        }
        if (subPart.contains("ساع") || subPart.contains("watch")) {
            return "Watch";
        }
        if (subPart.contains("شن") || subPart.contains("bag")) {
            return "Bags";
        }
        if (subPart.contains("قب") || subPart.contains("hat") || subPart.contains("cap")) {
            return "Hat";
        }
        if (bodyPart.contains("اكسسو")) {
            return "Accessories";
        }
        return "Tops";
    }

    private String getOutfitDescription() {
        StringBuilder desc = new StringBuilder("Taqmish Outfit");
        if (selectedTopItem != null) desc.append(" | Top: ").append(selectedTopItem.getTitel());
        if (selectedBottomItem != null) desc.append(" | Bottom: ").append(selectedBottomItem.getTitel());
        if (selectedShoesItem != null) desc.append(" | Shoes: ").append(selectedShoesItem.getTitel());
        if (selectedAccessoriesItem != null) desc.append(" | Accessories: ").append(selectedAccessoriesItem.getTitel());
        if (selectedWatchItem != null) desc.append(" | Watch: ").append(selectedWatchItem.getTitel());
        if (selectedBagItem != null) desc.append(" | Bag: ").append(selectedBagItem.getTitel());
        if (selectedHatItem != null) desc.append(" | Hat: ").append(selectedHatItem.getTitel());
        return desc.toString();
    }

    private boolean hasMinimumOutfit() {
        return selectedTopItem != null && selectedBottomItem != null;
    }

    private void clearSelectedOutfit() {
        selectedTopItem = null;
        selectedBottomItem = null;
        selectedShoesItem = null;
        selectedWatchItem = null;
        selectedAccessoriesItem = null;
        selectedHatItem = null;
        selectedBagItem = null;
        updateSelectedViews();
        updateOutfitStatus();
        applyFilter();
    }

    private String resolveTimeOfDay(int hour) {
        if (hour < 12) {
            return "Morning";
        }
        if (hour < 18) {
            return "Evening";
        }
        return "Night";
    }

    private void openAddItemDialog() {
        View dialogView = LayoutInflater.from(getContext()).inflate(R.layout.dialog_home_add_item, null, false);
        dialogPreviewImage = dialogView.findViewById(R.id.dialogPreviewImage);
        dialogItemTitle = dialogView.findViewById(R.id.dialogItemTitle);
        dialogItemTypeSpinner = dialogView.findViewById(R.id.dialogItemTypeSpinner);
        dialogItemCategorySpinner = dialogView.findViewById(R.id.dialogItemCategorySpinner);
        dialogColorsText = dialogView.findViewById(R.id.dialogColorsText);
        dialogSaveProgress = dialogView.findViewById(R.id.dialogSaveProgress);
        Button chooseImageButton = dialogView.findViewById(R.id.dialogChooseImageButton);
        Button retakeButton = dialogView.findViewById(R.id.dialogRetakeButton);
        Button saveButton = dialogView.findViewById(R.id.dialogSaveItemButton);

        dialogItemTypeSpinner.setAdapter(new ArrayAdapter<>(requireContext(),
                android.R.layout.simple_spinner_dropdown_item, HOME_TYPES));
        dialogItemCategorySpinner.setAdapter(new ArrayAdapter<>(requireContext(),
                android.R.layout.simple_spinner_dropdown_item, STYLE_CATEGORIES));

        chooseImageButton.setOnClickListener(v -> galleryLauncher.launch("image/*"));
        retakeButton.setOnClickListener(v -> cameraLauncher.launch(null));
        saveButton.setOnClickListener(v -> saveCapturedItem());

        clearPendingDialogState();
        renderPendingPreview();

        addItemDialog = new AlertDialog.Builder(getContext())
                .setTitle("Add closet item")
                .setView(dialogView)
                .setNegativeButton("Cancel", (dialog, which) -> clearPendingDialogState())
                .create();
        addItemDialog.show();
        showImageSourceChooser();
    }

    private void showImageSourceChooser() {
        if (getContext() == null) {
            return;
        }

        new AlertDialog.Builder(getContext())
                .setTitle("Choose image source")
                .setItems(new String[] { "Take photo", "Choose from gallery" }, (dialog, which) -> {
                    if (which == 0) {
                        cameraLauncher.launch(null);
                    } else {
                        galleryLauncher.launch("image/*");
                    }
                })
                .show();
    }

    private void clearPendingDialogState() {
        pendingOriginalBitmap = null;
        pendingProcessedBitmap = null;
        pendingColors = new ArrayList<>();
    }

    private void handleSelectedBitmap(Bitmap bitmap) {
        pendingOriginalBitmap = bitmap;
        pendingProcessedBitmap = WardrobeImageHelper.removeLightBackground(bitmap);
        pendingColors = WardrobeImageHelper.extractDominantColors(pendingProcessedBitmap, 4);
        renderPendingPreview();
    }

    private void renderPendingPreview() {
        if (dialogPreviewImage == null || dialogColorsText == null) {
            return;
        }

        if (pendingProcessedBitmap != null) {
            dialogPreviewImage.setImageBitmap(pendingProcessedBitmap);
            dialogColorsText.setText("Dominant colors: " + TextUtils.join("  ", pendingColors));
        } else {
            dialogPreviewImage.setImageResource(R.drawable.placeholder_image);
            dialogColorsText.setText("Dominant colors: -");
        }
    }

    private void saveCapturedItem() {
        if (pendingProcessedBitmap == null) {
            Toast.makeText(getContext(), "Choose or capture an item image first.", Toast.LENGTH_SHORT).show();
            return;
        }

        String title = dialogItemTitle.getText().toString().trim();
        if (title.isEmpty()) {
            title = "Closet Item";
        }

        Item item = new Item();
        item.setTitel(title);
        item.setType(String.valueOf(dialogItemTypeSpinner.getSelectedItem()));
        item.setCategory(String.valueOf(dialogItemCategorySpinner.getSelectedItem()));
        item.setAddDate(new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Calendar.getInstance().getTime()));
        item.setColors(new ArrayList<>(pendingColors));
        item.setSex(genderSwitch.isChecked() ? "Female" : "Male");
        item.setSource("My Closet");

        dialogSaveProgress.setVisibility(View.VISIBLE);
        itemRepo.addItem(item, pendingProcessedBitmap, new ItemRepo.SaveItemCallback() {
            @Override
            public void onSuccess(Item savedItem) {
                if (getActivity() == null) {
                    return;
                }

                getActivity().runOnUiThread(() -> {
                    dialogSaveProgress.setVisibility(View.GONE);
                    if (addItemDialog != null && addItemDialog.isShowing()) {
                        addItemDialog.dismiss();
                    }
                    assignSelectedItem(savedItem);
                    clearPendingDialogState();
                    Toast.makeText(getContext(), "Item saved with extracted colors.", Toast.LENGTH_SHORT).show();
                });
            }

            @Override
            public void onError(Exception exception) {
                if (getActivity() == null) {
                    return;
                }

                getActivity().runOnUiThread(() -> {
                    dialogSaveProgress.setVisibility(View.GONE);
                    Toast.makeText(getContext(), "Failed to save item.", Toast.LENGTH_SHORT).show();
                });
            }
        });
    }

    private Bitmap readBitmapFromUri(Uri uri) {
        try (InputStream inputStream = requireContext().getContentResolver().openInputStream(uri)) {
            return BitmapFactory.decodeStream(inputStream);
        } catch (IOException e) {
            Toast.makeText(getContext(), "Failed to read image.", Toast.LENGTH_SHORT).show();
            return null;
        }
    }
}
