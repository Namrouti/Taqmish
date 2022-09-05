package com.dresstips.taqmish.ADO;

import android.content.Context;
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
import java.util.UUID;

public class SubClassADO {
    DatabaseReference mDataBaseref;
    StorageReference mStrorageRef;
    Context mContext;
    ClassSubType mClassSubType;
    public  SubClassADO(Context context,ClassSubType classSubType)
    {
        mDataBaseref = FirebaseDatabase.getInstance().getReference(ClassSubType.class.getSimpleName());
        mStrorageRef = FirebaseStorage.getInstance().getReference(ClassSubType.class.getSimpleName());
        mContext = context;
        mClassSubType = classSubType;
    }
    public  UploadTask addFile(Uri uri)
    {

        mClassSubType.setImageKey(UUID.randomUUID().toString());
        return mStrorageRef.child(mClassSubType.getKey()).putFile(uri);
    }
    public Task<Void> add( ClassSubType subType)
    {
        subType.setKey(mDataBaseref.push().getKey());
        return mDataBaseref.child(subType.getKey()).setValue(subType);
    }
    public Task<Void> update( HashMap<String, Object> subType)
    {
        return mDataBaseref.getParent().child(subType.get("key").toString()).updateChildren(subType);
    }
    public Task<Void> delete(HashMap<String,Object> subType)
    {
        return  mDataBaseref.child(subType.get("key").toString()).removeValue();
    }
}
