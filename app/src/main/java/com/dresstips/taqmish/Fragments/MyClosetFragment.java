package com.dresstips.taqmish.Fragments;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.palette.graphics.Palette;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.provider.MediaStore;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.Toast;

import com.dresstips.taqmish.Adapters.ImageAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.ADO.ADO;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.SiteClosets;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;


public class MyClosetFragment extends Fragment {

    private Spinner categorySpinner, sexSpinner, seasonSpinner,typeSpinner;
    private RecyclerView imageRecyclerView;
    private FloatingActionButton selectImagesButton;
    private Button saveButton;

    private List<Uri> selectedImageUris = new ArrayList<>();
    private ImageAdapter imageAdapter;
    private static final int IMAGE_PICK_CODE = 1001;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_my_closet, container, false);

        initUI(view);
        setupRecyclerView();
        setupSpinners();
        setupListeners();

        return view;
    }

    private void initUI(View view) {
        categorySpinner = view.findViewById(R.id.categorySpinner);
        sexSpinner = view.findViewById(R.id.sexSpinner);
        seasonSpinner = view.findViewById(R.id.seasonSpinner);
        typeSpinner = view.findViewById(R.id.typeSpinner);
        imageRecyclerView = view.findViewById(R.id.imageRecyclerView);
        selectImagesButton = view.findViewById(R.id.selectImagesButton);
        saveButton = view.findViewById(R.id.saveButton);
    }

    private void setupRecyclerView() {
        imageAdapter = new ImageAdapter(selectedImageUris);
        imageRecyclerView.setLayoutManager(new GridLayoutManager(getContext(), 3));
        imageRecyclerView.setAdapter(imageAdapter);
    }

    private void setupSpinners() {
        ArrayAdapter<String> categoryAdapter = new ArrayAdapter<>(getContext(),
                android.R.layout.simple_spinner_item,
                Arrays.asList("Casual", "Formal", "Sport", "Party", "Work")
               );
        categoryAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        categorySpinner.setAdapter(categoryAdapter);

        ArrayAdapter<String> sexAdapter = new ArrayAdapter<>(getContext(),
                android.R.layout.simple_spinner_item,
                Arrays.asList("Male", "Female"));
        sexAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        sexSpinner.setAdapter(sexAdapter);

        ArrayAdapter<String> seasonAdapter = new ArrayAdapter<>(getContext(),
                android.R.layout.simple_spinner_item,
                Arrays.asList("Summer", "Winter", "Spring", "Fall"));
        seasonAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        seasonSpinner.setAdapter(seasonAdapter);
        ArrayAdapter<String> typeAdapter = new ArrayAdapter<>(
                requireContext(),
                android.R.layout.simple_spinner_item,
                Arrays.asList("Top", "Bottom", "Shoes","Watch","Accessories","Hat","Bag","Jewelry")
        );
        typeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        typeSpinner.setAdapter(typeAdapter);

    }

    private void setupListeners() {
        selectImagesButton.setOnClickListener(v -> openImagePicker());

        saveButton.setOnClickListener(v -> saveToFirebase());
    }

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK);
        intent.setType("image/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(Intent.createChooser(intent, "Select Images"), IMAGE_PICK_CODE);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == IMAGE_PICK_CODE && resultCode == Activity.RESULT_OK) {
         //   selectedImageUris.clear();

            if (data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                for (int i = 0; i < count; i++) {
                    selectedImageUris.add(data.getClipData().getItemAt(i).getUri());
                }
            } else if (data.getData() != null) {
                selectedImageUris.add(data.getData());
            }

            imageAdapter.notifyDataSetChanged();
        }
    }

    private void saveToFirebase() {
        String category = categorySpinner.getSelectedItem().toString();
        String sex = sexSpinner.getSelectedItem().toString();
        String season = seasonSpinner.getSelectedItem().toString();
        String type = typeSpinner.getSelectedItem().toString(); // Assuming you added a spinner for 'type'

        for (Uri imageUri : selectedImageUris) {
            saveSiteClosetItem(imageUri, category, sex, season, type);
        }

        Toast.makeText(getContext(), "Items saved to closet", Toast.LENGTH_SHORT).show();
    }

    private void saveSiteClosetItem(Uri imageUri, String category, String sex, String season, String type) {
        if (ADO.getUserId() == null) {
            Toast.makeText(getContext(), "Please login first", Toast.LENGTH_SHORT).show();
            return;
        }

        String uid = ADO.getUserId().getUid();
        DatabaseReference dbRef = General.getDataBaseRefrenece(SiteClosets.class.getSimpleName()).child(uid);
        String id = dbRef.push().getKey();
        if (id == null) {
            Toast.makeText(getContext(), "Failed to generate item id", Toast.LENGTH_SHORT).show();
            return;
        }

        ArrayList<String> colors;
        try {
            colors = extractColorsSync(imageUri);
        } catch (IOException e) {
            colors = new ArrayList<>();
        }

        String bodyPart;
        String subParts = null;
        if ("Top".equalsIgnoreCase(type)) {
            bodyPart = "الجزء العلوي";
        } else if ("Bottom".equalsIgnoreCase(type)) {
            bodyPart = "الجزء السفلي";
        } else {
            bodyPart = "اكسسوارات";
            if ("Shoes".equalsIgnoreCase(type)) {
                subParts = "حذاء";
            } else if ("Watch".equalsIgnoreCase(type)) {
                subParts = "ساعه";
            } else {
                subParts = type;
            }
        }

        final String finalId = id;
        final String finalBodyPart = bodyPart;
        final String finalSubParts = subParts;
        final ArrayList<String> finalColors = colors;
        final String finalCategory = category;
        final String finalSex = sex;

        StorageReference storageRef = General.getStorageRefrence(SiteClosets.class.getSimpleName())
                .child(uid)
                .child(id + "." + General.getExtention(imageUri, requireContext()));

        storageRef.putFile(imageUri)
                .addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
                    @Override
                    public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                        storageRef.getDownloadUrl().addOnSuccessListener(new OnSuccessListener<Uri>() {
                            @Override
                            public void onSuccess(Uri downloadUri) {
                                SiteClosets sc = new SiteClosets();
                                sc.setId(finalId);
                                sc.setBodyPart(finalBodyPart);
                                sc.setSubParts(finalSubParts);
                                sc.setFilePath(downloadUri.toString());
                                sc.setColors(finalColors);
                                sc.setMainClass(finalCategory);
                                sc.setSex(finalSex);
                                dbRef.child(finalId).setValue(sc);
                            }
                        });
                    }
                })
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        Toast.makeText(getContext(), "Upload failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private ArrayList<String> extractColorsSync(Uri imageUri) throws IOException {
        Bitmap bitmap = MediaStore.Images.Media.getBitmap(requireActivity().getContentResolver(), imageUri);
        Bitmap scaled = Bitmap.createScaledBitmap(bitmap, 256, 256, true);

        Palette palette = Palette.from(scaled).generate();
        ArrayList<String> colorHexList = new ArrayList<>();

        addSwatch(colorHexList, palette.getVibrantSwatch());
        addSwatch(colorHexList, palette.getLightVibrantSwatch());
        addSwatch(colorHexList, palette.getDarkVibrantSwatch());
        addSwatch(colorHexList, palette.getMutedSwatch());
        addSwatch(colorHexList, palette.getLightMutedSwatch());
        addSwatch(colorHexList, palette.getDarkMutedSwatch());

        return colorHexList;
    }

    private void addSwatch(ArrayList<String> list, Palette.Swatch swatch) {
        if (swatch == null) {
            return;
        }
        String hex = String.format("#%06X", (0xFFFFFF & swatch.getRgb()));
        if (!list.contains(hex)) {
            list.add(hex);
        }
    }


}
