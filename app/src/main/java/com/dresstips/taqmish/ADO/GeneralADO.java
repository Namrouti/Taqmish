package com.dresstips.taqmish.ADO;

import android.net.Uri;

import com.dresstips.taqmish.classes.ClassSubType;
import com.dresstips.taqmish.classes.ClassType;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.util.ArrayList;

public class GeneralADO<T> {




    public static <T>   ArrayList<T> getData(T data)
    {
        ArrayList<T> arrayList = null;
        StorageReference sr;
        DatabaseReference dbr;
        if(data instanceof ClassType)
      {

          dbr = General.getDataBaseRefrenece(ClassType.class.getSimpleName());
          dbr.get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
              @Override
              public void onSuccess(DataSnapshot dataSnapshot) {
                  for(DataSnapshot d : dataSnapshot.getChildren())
                  {
                        ClassType ct = d.getValue(ClassType.class);
                        arrayList.add((T) ct);
                  }

              }
          });


      }
        if(data instanceof ClassSubType)
        {
            ClassSubType cst = (ClassSubType) data;
            dbr = General.getDataBaseRefrenece(ClassSubType.class.getSimpleName()).child(cst.getRootKey());
            dbr.get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
                @Override
                public void onSuccess(DataSnapshot dataSnapshot) {
                    for(DataSnapshot ds : dataSnapshot.getChildren())
                    {
                        ClassSubType st = ds.getValue(ClassSubType.class);
                        arrayList.add((T)st);
                    }

                }
            });
        }


        return arrayList;
    }
    public static<T> UploadTask saveImage(T data, Uri uri)
    {
        StorageReference st = null;
        if(data instanceof ClassType)
        {
            st = General.getStorageRefrence(ClassType.class.getSimpleName());

        }
        else if(data instanceof ClassSubType)
        {
            ClassSubType cst = (ClassSubType) data;
            st = General.getStorageRefrence(ClassSubType.class.getSimpleName()).child(cst.getRootKey());
        }
        return st.putFile(uri);
    }
}
