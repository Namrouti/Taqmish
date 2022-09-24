package com.dresstips.taqmish.ADO;

import android.content.Context;
import android.net.Uri;

import com.dresstips.taqmish.classes.ClassSubType;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnSuccessListener;
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

    public  SubClassADO(Context context)
    {
        mDataBaseref = FirebaseDatabase.getInstance().getReference(ClassSubType.class.getSimpleName());
        mStrorageRef = FirebaseStorage.getInstance().getReference(ClassSubType.class.getSimpleName());
        mContext = context;

    }
    public  void addFile(Uri uri, ClassSubType mClassSubType)
    {

        mClassSubType.setImageKey(UUID.randomUUID().toString());
        mClassSubType.setImageName(mClassSubType.getImageKey() + "." + General.getExtention(uri,mContext));
         mStrorageRef.child(mClassSubType.getImageKey()).putFile(uri).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
            @Override
            public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                 String subtypekey = mDataBaseref.push().getKey();
                mClassSubType.setKey(subtypekey);
                mClassSubType.setImageUrl(taskSnapshot.getStorage().getDownloadUrl().toString());
                mDataBaseref.child(mClassSubType.getRootKey()).child(mClassSubType.getKey()).setValue(mClassSubType);



            }
        });
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
    public void  getData()
    {

    }
}
