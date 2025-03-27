package com.dresstips.taqmish.dialogs;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.enums.items.ItemCategory;
import com.dresstips.taqmish.enums.items.ItemType;
import com.dresstips.taqmish.models.Item;
import com.dresstips.taqmish.repo.ItemRepo;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AddItemDialog extends DialogFragment {
    private ImageView itemImageView;
    private Button pickImageButton, saveButton, cancelButton;
    private ProgressBar progressBar;
    Spinner itemCategory,  itemType;
    EditText itemTitle;

    private Uri selectedImageUri;
    private Bitmap processedBitmap;

    private static final int GALLERY_REQUEST_CODE = 1;
    private static final int CAMERA_REQUEST_CODE = 2;
    private static final String STORAGE_PATH = "items/";
    ItemRepo repo;

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        repo = new ItemRepo(getContext())   ;
        View dialogView = getActivity().getLayoutInflater().inflate(R.layout.dialog_add_item, null);
        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        LayoutInflater inflater = getLayoutInflater();
        builder.setView(dialogView);

        initViews(dialogView);
        setListeners();
        setupSpinners();
        return builder.create();
    }

    private void initViews(View view) {
        itemImageView = view.findViewById(R.id.itemImageView);
        pickImageButton = view.findViewById(R.id.pickImageButton);
        saveButton = view.findViewById(R.id.saveButton);
        cancelButton = view.findViewById(R.id.cancelButton);
        progressBar = view.findViewById(R.id.progressBar);
        itemType = view.findViewById(R.id.itemType);
        itemCategory = view.findViewById(R.id.itemCategory);
        itemTitle = view.findViewById(R.id.itemTitle);
    }

    private void setListeners() {
        pickImageButton.setOnClickListener(v -> openImageChooser());
        saveButton.setOnClickListener(v -> uploadItemToFirebase());
        cancelButton.setOnClickListener(v -> dismiss());
    }
    private void setupSpinners() {


        // Setup itemCategory spinner
        setupSpinner(itemCategory, R.array.categories);

        // Setup itemType spinner
        setupSpinner(itemType, R.array.types);
    }

    private void openImageChooser() {
        AlertDialog.Builder builder = new AlertDialog.Builder(getContext());
        builder.setTitle("Choose Image Source");

        String[] options = {"Take Photo", "Choose from Gallery"};
        builder.setItems(options, (dialog, which) -> {
            if (which == 0) {
                openCamera();
            } else if (which == 1) {
                openGallery();
            }
        });

        builder.show();
    }
    private void openCamera() {
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (intent.resolveActivity(getActivity().getPackageManager()) != null) {
            startActivityForResult(intent, CAMERA_REQUEST_CODE);
        }
    }
    private void openGallery() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        intent.setType("image/*");
        startActivityForResult(intent, GALLERY_REQUEST_CODE);
    }
    private void setupSpinner(Spinner spinner, int arrayResource) {
        ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(
                getContext(),
                arrayResource,
                android.R.layout.simple_spinner_item
        );
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
    }


    private String getCurrentDate() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        return sdf.format(new Date());
    }


    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (resultCode == Activity.RESULT_OK) {
            if (requestCode == CAMERA_REQUEST_CODE && data != null) {
                Bitmap photo = (Bitmap) data.getExtras().get("data");
                itemImageView.setImageBitmap(photo);
            } else if (requestCode == GALLERY_REQUEST_CODE && data != null) {
                Uri imageUri = data.getData();
                selectedImageUri = imageUri;
                itemImageView.setImageURI(imageUri);
            }
        }
    }



    private void uploadItemToFirebase() {
        if(selectedImageUri != null)
        {
            Item item = new Item();
            item.setType(ItemType.valueOf(itemType.getSelectedItem().toString()));
            item.setCategory(ItemCategory.valueOf(itemCategory.getSelectedItem().toString()));
            item.setAddDate(getCurrentDate());
            item.setTitel(itemTitle.getText().toString());
            repo.AddItem(item,selectedImageUri);

        }
        else
        {
            Toast.makeText(getContext(),"Plasese Select One Image",Toast.LENGTH_LONG);
        }




    }










}


