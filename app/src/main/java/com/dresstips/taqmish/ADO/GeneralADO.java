package com.dresstips.taqmish.ADO;

import android.content.Context;
import android.net.Uri;
import android.widget.ArrayAdapter;
import android.widget.Spinner;

import com.dresstips.taqmish.classes.ClassSubType;
import com.dresstips.taqmish.classes.ClassType;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.util.ArrayList;
import java.util.List;

public class GeneralADO {




    public static ArrayList<ClassType> getClassType(DatabaseReference ref)
    {
        ArrayList<ClassType> arrayList = new ArrayList();
        ref.get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                for(DataSnapshot d: dataSnapshot.getChildren())
                {
                    ClassType ct  = d.getValue(ClassType.class);
                    arrayList.add(ct);
                }
            }
        });


        return  arrayList;
    }
    public static ArrayList<ClassSubType> getClassSubType(DatabaseReference ref)
    {
        ArrayList<ClassSubType> arrayList = new ArrayList();
        ref.get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                for(DataSnapshot d : dataSnapshot.getChildren())
                {
                    ClassSubType cst  = d.getValue(ClassSubType.class);
                    arrayList.add(cst);
                }
            }
        });

        return arrayList;
    }

    public static void addtoSpinner(Spinner spin, String[] data, Context context)
    {
        ArrayAdapter ad = new ArrayAdapter(context, android.R.layout.simple_spinner_item, data);
        ad.setDropDownViewResource(
                android.R.layout
                        .simple_spinner_dropdown_item);
        spin.setAdapter(ad);
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
