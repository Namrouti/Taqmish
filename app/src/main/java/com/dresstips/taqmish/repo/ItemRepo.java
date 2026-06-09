package com.dresstips.taqmish.repo;

import android.content.Context;
import android.graphics.Bitmap;
import android.net.Uri;
import android.widget.Toast;

import com.dresstips.taqmish.ADO.ADO;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.models.Item;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.io.ByteArrayOutputStream;
import java.util.UUID;

public class ItemRepo {
    public interface SaveItemCallback {
        void onSuccess(Item item);
        void onError(Exception exception);
    }

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
        item.setItemKey(itemDBRefl.child(ADO.getUserId().getUid()).push().getKey());

        itemSorageRef.child(item.getImageName()).putFile(uri).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
            @Override
            public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                taskSnapshot.getStorage().getDownloadUrl().addOnSuccessListener(downloadUri -> {
                    item.setFilePath(downloadUri.toString());
                    itemDBRefl.child(ADO.getUserId().getUid()).child(item.getItemKey()).setValue(item);
                    Toast.makeText(context, "Item successfully added", Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    public void addItem(Item item, Bitmap bitmap, SaveItemCallback callback) {
        if (ADO.getUserId() == null) {
            if (callback != null) {
                callback.onError(new IllegalStateException("User is not logged in"));
            }
            return;
        }

        item.setImageId(UUID.randomUUID().toString());
        item.setImageName(item.getImageId() + ".png");
        item.setItemKey(itemDBRefl.child(ADO.getUserId().getUid()).push().getKey());

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream);
        byte[] imageBytes = outputStream.toByteArray();

        itemSorageRef.child(item.getImageName()).putBytes(imageBytes)
                .addOnSuccessListener(taskSnapshot -> taskSnapshot.getStorage().getDownloadUrl()
                        .addOnSuccessListener(downloadUri -> {
                            item.setFilePath(downloadUri.toString());
                            itemDBRefl.child(ADO.getUserId().getUid()).child(item.getItemKey()).setValue(item)
                                    .addOnSuccessListener(unused -> {
                                        Toast.makeText(context, "Item successfully added", Toast.LENGTH_LONG).show();
                                        if (callback != null) {
                                            callback.onSuccess(item);
                                        }
                                    })
                                    .addOnFailureListener(e -> {
                                        if (callback != null) {
                                            callback.onError(e);
                                        }
                                    });
                        }))
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(Exception e) {
                        if (callback != null) {
                            callback.onError(e);
                        }
                    }
                });
    }
}
