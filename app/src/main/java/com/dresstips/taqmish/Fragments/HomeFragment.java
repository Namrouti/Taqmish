package com.dresstips.taqmish.Fragments;

import android.content.Intent;
import android.os.Bundle;
import android.provider.CalendarContract;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Activities.DisplayImageActivity;
import com.dresstips.taqmish.Adapters.ItemAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.models.Item;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class HomeFragment extends Fragment implements ItemAdapter.OnItemClicked {
    private Switch genderSwitch;
    private ImageButton captureImageButton;
    private ImageView selectedTop, selectedBottom, selectedShoes, selectedWatch, selectedAccessories, selectedHat,
            selectedBag;
    private TextView outfitStatusText;
    private Button suggestOutfitButton;
    private Button addToCalendarButton;
    private Button clearOutfitButton;
    private RecyclerView recyclerView;

    private List<Item> itemList = new ArrayList<>();
    private ItemAdapter itemAdapter;

    private Item selectedTopItem;
    private Item selectedBottomItem;
    private Item selectedShoesItem;
    private Item selectedWatchItem;
    private Item selectedAccessoriesItem;
    private Item selectedHatItem;
    private Item selectedBagItem;

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

    private void loadData() {
        DatabaseReference db = FirebaseDatabase.getInstance().getReference(Item.class.getSimpleName());
        db.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                itemList.clear();
                for (DataSnapshot d : snapshot.getChildren()) {
                    Item item = d.getValue(Item.class);
                    if (item != null) {
                        itemList.add(item);
                    }
                }
                itemAdapter.updateList(itemList);
                updateOutfitStatus();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Toast.makeText(getContext(), "فشل تحميل عناصر الخزانة.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void initRecyclerView() {
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext(), LinearLayoutManager.HORIZONTAL, false));
        itemAdapter = new ItemAdapter(itemList, getContext(), this);
        recyclerView.setAdapter(itemAdapter);
    }

    @Override
    public void onItemClick(Item item) {
        assignSelectedItem(item);
    }

    private void initListeners() {
        genderSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            String message = isChecked ? "تم اختيار أنثى" : "تم اختيار ذكر";
            Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
        });

        captureImageButton.setOnClickListener(v -> openCamera());
        suggestOutfitButton.setOnClickListener(v -> suggestOutfit());
        addToCalendarButton.setOnClickListener(v -> saveOutfitToCalendar());
        clearOutfitButton.setOnClickListener(v -> clearSelectedOutfit());
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
        outfitStatusText = view.findViewById(R.id.outfitStatusText);
        suggestOutfitButton = view.findViewById(R.id.suggestOutfitButton);
        addToCalendarButton = view.findViewById(R.id.addToCalendarButton);
        clearOutfitButton = view.findViewById(R.id.clearOutfitButton);
        recyclerView = view.findViewById(R.id.recyclerView);
    }

    private void assignSelectedItem(Item item) {
        String slot = getSlotForItem(item);
        switch (slot) {
            case "Top":
                selectedTopItem = item;
                break;
            case "Bottom":
                selectedBottomItem = item;
                break;
            case "Shoes":
                selectedShoesItem = item;
                break;
            case "Accessories":
                selectedAccessoriesItem = item;
                break;
            case "Bag":
                selectedBagItem = item;
                break;
            case "Watch":
                selectedWatchItem = item;
                break;
            case "Hat":
                selectedHatItem = item;
                break;
            default:
                if (selectedTopItem == null) {
                    selectedTopItem = item;
                } else if (selectedBottomItem == null) {
                    selectedBottomItem = item;
                }
                break;
        }
        updateSelectedViews();
        updateOutfitStatus();
    }

    private String getSlotForItem(Item item) {
        String type = item.getType() == null ? "" : item.getType().toLowerCase();
        String category = item.getCategory() == null ? "" : item.getCategory().toLowerCase();

        if (type.contains("top") || category.contains("top") || type.contains("shirt") || category.contains("shirt")
                || type.contains("t-shirt") || category.contains("t-shirt") || category.contains("upper")) {
            return "Top";
        }
        if (type.contains("bottom") || category.contains("bottom") || type.contains("pants")
                || category.contains("pants") || type.contains("jeans") || category.contains("jeans")
                || type.contains("skirt") || category.contains("skirt")) {
            return "Bottom";
        }
        if (type.contains("shoe") || category.contains("shoe") || type.contains("boots")
                || category.contains("boots")) {
            return "Shoes";
        }
        if (type.contains("bag") || category.contains("bag") || category.contains("handbag")
                || type.contains("purse")) {
            return "Bag";
        }
        if (type.contains("watch") || category.contains("watch") || type.contains("jewelry")
                || category.contains("jewelry") || category.contains("accessories") || type.contains("accessories")) {
            return "Accessories";
        }
        if (type.contains("hat") || category.contains("hat") || category.contains("cap") || type.contains("cap")) {
            return "Hat";
        }
        return "Top";
    }

    private void updateSelectedViews() {
        loadItemIntoView(selectedTopItem, selectedTop);
        loadItemIntoView(selectedBottomItem, selectedBottom);
        loadItemIntoView(selectedShoesItem, selectedShoes);
        loadItemIntoView(selectedWatchItem, selectedWatch);
        loadItemIntoView(selectedAccessoriesItem, selectedAccessories);
        loadItemIntoView(selectedHatItem, selectedHat);
        loadItemIntoView(selectedBagItem, selectedBag);
    }

    private void loadItemIntoView(Item item, ImageView imageView) {
        if (item != null && item.getFilePath() != null && !item.getFilePath().isEmpty()) {
            Picasso.with(getContext()).load(item.getFilePath()).fit().into(imageView);
        } else {
            imageView.setImageResource(R.drawable.bg_input_field);
        }
    }

    private void updateOutfitStatus() {
        StringBuilder builder = new StringBuilder();
        builder.append("ملف الزي الحالي:\n");
        if (selectedTopItem != null)
            builder.append("علوي: ").append(selectedTopItem.getTitel()).append("\n");
        if (selectedBottomItem != null)
            builder.append("سفلي: ").append(selectedBottomItem.getTitel()).append("\n");
        if (selectedShoesItem != null)
            builder.append("أحذية: ").append(selectedShoesItem.getTitel()).append("\n");
        if (selectedWatchItem != null)
            builder.append("ساعة: ").append(selectedWatchItem.getTitel()).append("\n");
        if (selectedAccessoriesItem != null)
            builder.append("إكسسوار: ").append(selectedAccessoriesItem.getTitel()).append("\n");
        if (selectedBagItem != null)
            builder.append("حقيبة: ").append(selectedBagItem.getTitel()).append("\n");
        if (selectedHatItem != null)
            builder.append("قبعة: ").append(selectedHatItem.getTitel()).append("\n");
        if (builder.toString().equals("ملف الزي الحالي:\n")) {
            builder.append("اختر قطعًا من الخزانة أو اضغط اقتراح زي.");
        }
        outfitStatusText.setText(builder.toString());
    }

    private void suggestOutfit() {
        if (itemList.isEmpty()) {
            Toast.makeText(getContext(), "لا توجد عناصر في الخزانة بعد.", Toast.LENGTH_SHORT).show();
            return;
        }

        if (selectedTopItem == null) {
            selectedTopItem = pickFirstBySlot("Top");
        }
        if (selectedBottomItem == null) {
            selectedBottomItem = findBestMatchForSlot("Bottom", selectedTopItem);
        }
        if (selectedShoesItem == null) {
            selectedShoesItem = findBestMatchForSlot("Shoes", selectedTopItem);
        }
        if (selectedAccessoriesItem == null) {
            selectedAccessoriesItem = findBestMatchForSlot("Accessories", selectedTopItem);
        }
        if (selectedBagItem == null) {
            selectedBagItem = findBestMatchForSlot("Bag", selectedTopItem);
        }
        updateSelectedViews();
        updateOutfitStatus();
        Toast.makeText(getContext(), "تم اقتراح زي بناءً على نظرية الألوان.", Toast.LENGTH_SHORT).show();
    }

    private Item pickFirstBySlot(String slot) {
        for (Item item : itemList) {
            if (getSlotForItem(item).equals(slot)) {
                return item;
            }
        }
        return null;
    }

    private Item findBestMatchForSlot(String slot, Item base) {
        if (base == null) {
            return pickFirstBySlot(slot);
        }

        List<String> baseColors = base.getColors();
        if (baseColors == null || baseColors.isEmpty()) {
            return pickFirstBySlot(slot);
        }

        String baseColor = baseColors.get(0).toLowerCase();
        String complement = findComplementaryColor(baseColor);
        Item fallback = null;
        for (Item item : itemList) {
            if (!getSlotForItem(item).equals(slot))
                continue;
            if (item.getColors() == null || item.getColors().isEmpty()) {
                if (fallback == null)
                    fallback = item;
                continue;
            }
            for (String color : item.getColors()) {
                if (color != null && color.toLowerCase().contains(complement)) {
                    return item;
                }
            }
            if (fallback == null) {
                fallback = item;
            }
        }
        return fallback;
    }

    private String findComplementaryColor(String baseColor) {
        if (baseColor.contains("أحمر") || baseColor.contains("red"))
            return "أخضر";
        if (baseColor.contains("أزرق") || baseColor.contains("blue"))
            return "برتقالي";
        if (baseColor.contains("أصفر") || baseColor.contains("yellow"))
            return "بنفسجي";
        if (baseColor.contains("أخضر") || baseColor.contains("green"))
            return "أحمر";
        if (baseColor.contains("بنفسجي") || baseColor.contains("purple"))
            return "أصفر";
        if (baseColor.contains("برتقالي") || baseColor.contains("orange"))
            return "أزرق";
        if (baseColor.contains("أسود") || baseColor.contains("black"))
            return "أبيض";
        if (baseColor.contains("أبيض") || baseColor.contains("white"))
            return "أسود";
        return "أبيض";
    }

    private void saveOutfitToCalendar() {
        if (selectedTopItem == null && selectedBottomItem == null && selectedShoesItem == null
                && selectedAccessoriesItem == null && selectedBagItem == null && selectedWatchItem == null
                && selectedHatItem == null) {
            Toast.makeText(getContext(), "اختر زيًا أولاً قبل إضافته إلى التقويم.", Toast.LENGTH_SHORT).show();
            return;
        }

        Calendar beginTime = Calendar.getInstance();
        beginTime.add(Calendar.HOUR_OF_DAY, 1);
        Calendar endTime = (Calendar) beginTime.clone();
        endTime.add(Calendar.HOUR_OF_DAY, 1);

        Intent intent = new Intent(Intent.ACTION_INSERT)
                .setData(CalendarContract.Events.CONTENT_URI)
                .putExtra(CalendarContract.Events.TITLE, "تنسيق خزانة اليوم")
                .putExtra(CalendarContract.Events.DESCRIPTION, getOutfitDescription())
                .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, beginTime.getTimeInMillis())
                .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endTime.getTimeInMillis());

        if (intent.resolveActivity(requireActivity().getPackageManager()) != null) {
            startActivity(intent);
        } else {
            Toast.makeText(getContext(), "لا يوجد تطبيق تقويم متاح.", Toast.LENGTH_SHORT).show();
        }
    }

    private String getOutfitDescription() {
        StringBuilder desc = new StringBuilder();
        if (selectedTopItem != null)
            desc.append("الجزء العلوي: ").append(selectedTopItem.getTitel()).append("\n");
        if (selectedBottomItem != null)
            desc.append("الجزء السفلي: ").append(selectedBottomItem.getTitel()).append("\n");
        if (selectedShoesItem != null)
            desc.append("الأحذية: ").append(selectedShoesItem.getTitel()).append("\n");
        if (selectedWatchItem != null)
            desc.append("الساعة: ").append(selectedWatchItem.getTitel()).append("\n");
        if (selectedAccessoriesItem != null)
            desc.append("الإكسسوارات: ").append(selectedAccessoriesItem.getTitel()).append("\n");
        if (selectedBagItem != null)
            desc.append("الحقيبة: ").append(selectedBagItem.getTitel()).append("\n");
        if (selectedHatItem != null)
            desc.append("القبعة: ").append(selectedHatItem.getTitel()).append("\n");
        return desc.toString();
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
    }

    private void openCamera() {
        Intent intent = new Intent(getActivity(), DisplayImageActivity.class);
        startActivity(intent);
    }
}
