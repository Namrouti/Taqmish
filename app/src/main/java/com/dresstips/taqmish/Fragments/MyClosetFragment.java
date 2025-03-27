package com.dresstips.taqmish.Fragments;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.Toast;

import com.dresstips.taqmish.Adapters.ItemAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.dialogs.AddItemDialog;
import com.dresstips.taqmish.dialogs.saveOutfitDialog;
import com.dresstips.taqmish.enums.items.ItemCategory;
import com.dresstips.taqmish.enums.items.ItemType;
import com.dresstips.taqmish.models.Item;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;


public class MyClosetFragment extends Fragment {



        // Inflate the layout for this fragment
        RecyclerView recyclerView;
        FloatingActionButton addItemButton;
        Spinner filterSpinner;
        ItemAdapter adapter;
        List<Item> allItems = new ArrayList<>();

        final int PICK_IMAGE_REQUEST = 1;
        final int CAMERA_REQUEST = 2;

        @Nullable
        @Override
        public View onCreateView (@NonNull LayoutInflater inflater, @Nullable ViewGroup
        container, @Nullable Bundle savedInstanceState){
            View view = inflater.inflate(R.layout.fragment_my_closet, container, false);

            recyclerView = view.findViewById(R.id.recyclerView);
            addItemButton = view.findViewById(R.id.addItemButton);
            filterSpinner = view.findViewById(R.id.filterSpinner);

            setupRecyclerView();
            setupFilterSpinner();
            addItemButton.setOnClickListener(v -> showImagePickerDialog());

            return view;
        }

        public void setupRecyclerView () {
            adapter = new ItemAdapter(new ArrayList<>());
            recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
            recyclerView.setAdapter(adapter);

            fetchItemsFromFirebase();
        }

        private void setupFilterSpinner () {
            List<String> filterOptions = Arrays.asList("All", "Category 1", "Category 2", "Type A", "Type B");
            ArrayAdapter<String> spinnerAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_item, filterOptions);
            spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
            filterSpinner.setAdapter(spinnerAdapter);

            filterSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
                @Override
                public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                    filterItems(filterOptions.get(position));
                }

                @Override
                public void onNothingSelected(AdapterView<?> parent) {
                }
            });
        }

        public void filterItems (String filter){
            List<Item> filteredList;
            switch (filter) {
                case "Category 1":
                    filteredList = allItems.stream().filter(item -> item.getCategory() == ItemCategory.Casual).collect(Collectors.toList());
                    break;
                case "Category 2":
                    filteredList = allItems.stream().filter(item -> item.getCategory() == ItemCategory.Formal).collect(Collectors.toList());
                    break;
                case "Type A":
                    filteredList = allItems.stream().filter(item -> item.getType() == ItemType.Bag).collect(Collectors.toList());
                    break;
                case "Type B":
                    filteredList = allItems.stream().filter(item -> item.getType() == ItemType.Down).collect(Collectors.toList());
                    break;
                default:
                    filteredList = new ArrayList<>(allItems);
                    break;
            }
            adapter.updateList(filteredList);
        }

        private void fetchItemsFromFirebase () {
            DatabaseReference database = FirebaseDatabase.getInstance().getReference("items");
            database.addValueEventListener(new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot snapshot) {
                    allItems.clear();
                    for (DataSnapshot itemSnapshot : snapshot.getChildren()) {
                        Item item = itemSnapshot.getValue(Item.class);
                        if (item != null) {
                            allItems.add(item);
                        }
                    }
                    adapter.updateList(allItems);
                }

                @Override
                public void onCancelled(@NonNull DatabaseError error) {
                    Toast.makeText(requireContext(), "Failed to load items", Toast.LENGTH_SHORT).show();
                }
            });
        }

        private void showImagePickerDialog () {
            DialogFragment df = new AddItemDialog();
            df.show(this.getActivity().getSupportFragmentManager(), "New Item");
        }








}