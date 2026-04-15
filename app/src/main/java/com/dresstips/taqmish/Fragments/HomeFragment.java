package com.dresstips.taqmish.Fragments;




import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.media.Image;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.Switch;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Activities.DisplayImageActivity;
import com.dresstips.taqmish.Adapters.ItemAdapter;
import com.dresstips.taqmish.Adapters.SimilarImagesAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ColorGroup;
import com.dresstips.taqmish.models.Item;
import com.dresstips.taqmish.models.ItemRepo;
import com.dresstips.taqmish.models.SimilarImage;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.List;

public class HomeFragment extends Fragment
{
    private static final int REQUEST_IMAGE_CAPTURE = 100;
    private Switch genderSwitch;
    private ImageButton captureImageButton, topPart, downPart, dress, shoes, watch, accessories;
    private ImageView selectedTop, selectedBottom, selectedShoes, selectedWatch, selectedAccessories, selectedHat, selectedBag;
    private RecyclerView recyclerView;
    List<Item> itemList;
    ItemAdapter itemAdapter;
    ItemRepo itemRepo;


    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home_new_2, container, false);
        initViews(view);
        initListeners();
        loadData();
        initRecyclerView();


        return view;
    }

    private void loadData() {
        itemList = itemRepo.getAllItem();
        DatabaseReference db  = FirebaseDatabase.getInstance().getReference(Item.class.getSimpleName());
        db.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                for(DataSnapshot d : snapshot.getChildren())
                {
                    Item cg = d.getValue(Item.class);
                    itemList.add(cg);
                    itemAdapter.notifyDataSetChanged();
                }

            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });
    }

    private void initRecyclerView() {

        recyclerView.setLayoutManager(new LinearLayoutManager(this.getContext(), LinearLayoutManager.HORIZONTAL, false));


        itemAdapter = new ItemAdapter(itemList, this.getContext(),this::onItemClicked);
        recyclerView.setAdapter(itemAdapter);
    }

    private void onItemClicked(Item item) {

    }
    private void initListeners() {
        genderSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (isChecked) {
                // Switch is ON (e.g., Female)
                Log.d("SwitchCheck", "Female selected");
            } else {
                // Switch is OFF (e.g., Male)
                Log.d("SwitchCheck", "Male selected");
            }
        });
    }

    private void initViews(View view) {
        genderSwitch = view.findViewById(R.id.genderSwitch);
        captureImageButton = view.findViewById(R.id.captureImageButton);
        itemList = new ArrayList();
        itemRepo = new ItemRepo(this.getContext());
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
       /* Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (takePictureIntent.resolveActivity(requireActivity().getPackageManager()) != null) {
            startActivityForResult(takePictureIntent, REQUEST_IMAGE_CAPTURE);
        }*/
        Intent intent = new Intent(getActivity(), DisplayImageActivity.class);
        startActivity(intent);
    }


}
