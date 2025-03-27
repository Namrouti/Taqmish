package com.dresstips.taqmish.Fragments;


import static com.dresstips.taqmish.OpencvCameryActivity.REQUEST_IMAGE_CAPTURE;

import android.content.Intent;
import android.graphics.Bitmap;
import android.media.Image;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.Switch;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Activities.DisplayImageActivity;
import com.dresstips.taqmish.R;

public class HomeFragment extends Fragment
{
    private static final int REQUEST_IMAGE_CAPTURE = 100;
    private Switch genderSwitch;
    private ImageButton captureImageButton, topPart, downPart, dress, shoes, watch, accessories;
    private ImageView selectedTop, selectedBottom, selectedShoes, selectedWatch, selectedAccessories, selectedHat, selectedBag;
    private RecyclerView recyclerView;

    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home_new_2, container, false);
        initViews(view);


        return view;
    }
    private void initViews(View view) {
        genderSwitch = view.findViewById(R.id.genderSwitch);
        captureImageButton = view.findViewById(R.id.captureImageButton);

        topPart = view.findViewById(R.id.topPart);
        downPart = view.findViewById(R.id.downPart);
        dress = view.findViewById(R.id.dress);
        shoes = view.findViewById(R.id.shoes);
        watch = view.findViewById(R.id.watch);
        accessories = view.findViewById(R.id.accessories);

        selectedTop = view.findViewById(R.id.selectedTop);
        selectedBottom = view.findViewById(R.id.selectedBottom);
        selectedShoes = view.findViewById(R.id.selectedShoes);
        selectedWatch = view.findViewById(R.id.selectedWatch);
        selectedAccessories = view.findViewById(R.id.selectedAccessories);
        selectedHat = view.findViewById(R.id.selectedHat);
        selectedBag = view.findViewById(R.id.selectedBag);

        recyclerView = view.findViewById(R.id.recyclerView);

        captureImageButton.setOnClickListener(v -> openCamera());
    }
    private void openCamera() {
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (takePictureIntent.resolveActivity(requireActivity().getPackageManager()) != null) {
            startActivityForResult(takePictureIntent, REQUEST_IMAGE_CAPTURE);
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == getActivity().RESULT_OK) {
            Bundle extras = data.getExtras();
            Bitmap imageBitmap = (Bitmap) extras.get("data");
            Intent intent = new Intent(getActivity(), DisplayImageActivity.class);
            intent.putExtra("imageUri", imageBitmap);
            startActivity(intent);
        }
    }

}
