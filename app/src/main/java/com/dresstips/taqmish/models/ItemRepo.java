package com.dresstips.taqmish.models;

import android.content.Context;
import android.net.Uri;

import androidx.annotation.NonNull;

import com.dresstips.taqmish.classes.ColorGroup;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.enums.items.ItemCategory;
import com.dresstips.taqmish.enums.items.ItemType;
import com.google.android.gms.tasks.OnCanceledListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class ItemRepo {
    DatabaseReference db  = FirebaseDatabase.getInstance().getReference(Item.class.getSimpleName());
    StorageReference sr = FirebaseStorage.getInstance().getReference(Item.class.getSimpleName());
    Context contex;
    public ItemRepo(Context context)
    {
        this.contex = context;
    }
    public String addItem(Item item, Uri imageUri)
    {
        String imageKey = UUID.randomUUID().toString() ;
        String ImageName = imageKey + "." + General.getExtention(imageUri,contex);

        sr.child(ImageName).putFile(imageUri).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
            @Override
            public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                item.setFilePath(taskSnapshot.getStorage().getDownloadUrl().toString());
                item.setImageName(ImageName);
                item.setImageId(imageKey);
                item.setItemKey(db.push().getKey());
                db.child(item.getItemKey()).setValue(item);

            }
        });
        return item.getItemKey();
    }
    public ArrayList<Item> getAllItem()
    {
        ArrayList<Item> data = new ArrayList<>();
        db.get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                for(DataSnapshot d : dataSnapshot.getChildren())
                {
                    Item i = d.getValue(Item.class);
                    data.add(i);
                }
            }
        });
        return data;
    }
    public ArrayList<Item> getItemByType(ItemType type)
    {
        ArrayList<Item> items = new ArrayList<>();
        db.orderByChild("type").equalTo(type.toString()).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                for (DataSnapshot d : snapshot.getChildren())
                {
                    Item  i = d.getValue(Item.class);
                    items.add(i);

                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });
        return items;
    }
    public ArrayList<Item> getItemsByCategory(ItemCategory category)
    {
        ArrayList<Item> items = new ArrayList<>();
        db.orderByChild("category").equalTo(category.toString()).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                for(DataSnapshot d: snapshot.getChildren())
                {
                    Item i = d.getValue(Item.class);
                    items.add(i);
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });
        return items;
    }
    public List<Item> getItemByTypeandCategory(ItemType type, ItemCategory category)
    {
        ArrayList<Item> ItemsfillterdOnType = getItemByType(type);
        List<Item> itemFilteredOnCatego = ItemsfillterdOnType.stream().filter(i -> i.getCategory() == category).collect(Collectors.toList());
        return itemFilteredOnCatego;
    }
}
