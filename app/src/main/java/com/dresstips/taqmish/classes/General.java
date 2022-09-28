package com.dresstips.taqmish.classes;

import android.content.ContentResolver;
import android.content.Context;
import android.net.Uri;
import android.webkit.MimeTypeMap;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;

public class General {

    public static String getExtention(Uri uri, Context context)
    {
        MimeTypeMap mim = MimeTypeMap.getSingleton();
        return  mim.getExtensionFromMimeType(context.getContentResolver().getType(uri));
    }

    public static DatabaseReference getDataBaseRefrenece(String childName)
    {
        return FirebaseDatabase.getInstance().getReference(childName);
    }
    public  static StorageReference getStorageRefrence(String childName)
    {
        return FirebaseStorage.getInstance().getReference(childName);
    }
}
