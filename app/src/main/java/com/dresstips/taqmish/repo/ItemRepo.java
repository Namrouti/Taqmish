package com.dresstips.taqmish.repo;

import android.content.Context;
import android.net.Uri;
import android.widget.Toast;

import com.dresstips.taqmish.ADO.ADO;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.models.Item;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.util.UUID;

public class ItemRepo {
    Context context;
    StorageReference itemSorageRef;
    DatabaseReference itemDBRefl;
    public  ItemRepo(Context context)
    {
        this.context = context  ;
        itemDBRefl = General.getDataBaseRefrenece("Item");
        itemSorageRef = General.getStorageRefrence("Item");
    }
    public void AddItem(Item item, Uri uri)
    {
        item.setImageId(UUID.randomUUID().toString());
        item.setImageName(item.getImageId() +"." + General.getExtention(uri,context));


        itemSorageRef.child(item.getImageId()).putFile(uri).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
            @Override
            public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                String subtypekey = itemDBRefl.push().getKey();
                item.setItemKey(subtypekey);
                item.setFilePath(taskSnapshot.getStorage().getDownloadUrl().toString());
                itemDBRefl.child(ADO.getUserId().getUid()).child(item.getItemKey()).setValue(item);
                Toast.makeText(context,"Item successfully added", Toast.LENGTH_LONG);


            }
        });
    }
}
