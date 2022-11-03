package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.content.res.Resources;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ClassSubType;
import com.dresstips.taqmish.classes.ClassType;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnSuccessListener;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

public class SubClassSpinAdapter extends ArrayAdapter {

    public SubClassSpinAdapter(@NonNull Context context, ArrayList<ClassSubType> data)
    {
        super(context,0,data);
    }

    @NonNull
    @Override
    public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        return super.getView(position, convertView, parent);
    }

    @Override
    public View getDropDownView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        return super.getDropDownView(position, convertView, parent);
    }
    public View initView(int position, View convertView,ViewGroup parent)
    {
        if(convertView == null)
        {
            convertView =  LayoutInflater.from(getContext()).inflate(R.layout.spinner_item,parent,false);
        }
        Context context= getContext();
        ImageView icon = convertView.findViewById(R.id.icon);
        TextView textview = convertView.findViewById(R.id.text);

        ClassSubType currentItem = (ClassSubType) getItem(position);

        if(currentItem != null) {
            textview.setText(currentItem.getArabicName());
            General.getStorageRefrence(ClassSubType.class.getSimpleName()).child(currentItem.getImageKey()).getDownloadUrl().addOnSuccessListener(new OnSuccessListener<Uri>() {
                @Override
                public void onSuccess(Uri uri) {
                    Picasso.with(context).load(uri).fit().into(icon);
                }
            });
        }

        return  convertView;
    }
}
