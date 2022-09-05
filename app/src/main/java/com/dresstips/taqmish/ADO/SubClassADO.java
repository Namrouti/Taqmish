package com.dresstips.taqmish.ADO;

import android.net.Uri;

import com.dresstips.taqmish.classes.ClassSubType;
import com.google.android.gms.tasks.Task;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import org.w3c.dom.CDATASection;

import java.util.HashMap;
import java.util.Map;

public class SubClassADO {
    DatabaseReference mDataBaseref;
    StorageReference mStrorageRef;
    public  SubClassADO()
    {
        mDataBaseref = FirebaseDatabase.getInstance().getReference(ClassSubType.class.getSimpleName());
        mStrorageRef = FirebaseStorage.getInstance().getReference(ClassSubType.class.getSimpleName());
    }
    public static UploadTask addItem(StorageReference ref, String child, Uri uri)
    {
        return ref.child(child).putFile(uri);
    }
    public Task<Void> addDBItem( ClassSubType subType)
    {
        subType.setKey(mDataBaseref.push().getKey());
        return mDataBaseref.child(subType.getKey()).setValue(subType);
    }
    public Task<Void> update( HashMap<String, Object> subType)
    {
        return mDataBaseref.getParent().child(subType.get("key").toString()).updateChildren(subType);
    }
}
