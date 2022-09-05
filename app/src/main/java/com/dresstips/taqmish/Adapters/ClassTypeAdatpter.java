package com.dresstips.taqmish.Adapters;

import android.app.Activity;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;


import com.dresstips.taqmish.Activities.ManageClasses;
import com.dresstips.taqmish.ClassType;
import com.dresstips.taqmish.R;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

public class ClassTypeAdatpter extends RecyclerView.Adapter<ClassTypeAdatpter.TypeViewHolder> {

    ArrayList<ClassType> types;
    StorageReference storageRef ;
    Context mContext;
    public ClassTypeAdatpter(ArrayList<ClassType> types, Context context)
    {
        this.types = types;
        mContext = context;
        storageRef = FirebaseStorage.getInstance().getReference("/MainClass/Images");


    }

    @NonNull
    @Override
    public ClassTypeAdatpter.TypeViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.classtype_card,parent,false);
        return new TypeViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ClassTypeAdatpter.TypeViewHolder holder, int position) {
        ClassType classType = types.get(position);
        holder.getArabicName().setText(classType.getArabicName());
        holder.getEnglishName().setText(classType.getEnglishName());
        Picasso.with(mContext).load(storageRef.child(classType.getImageUrl()).getDownloadUrl().toString()).into(holder.getImage());


    }

    @Override
    public int getItemCount() {
        return types.size();
    }

    public static class TypeViewHolder extends RecyclerView.ViewHolder {
        TextView arabicName,englishName;
        ImageView image;
        ImageButton imageButton;
        public TypeViewHolder(@NonNull View itemView) {
            super(itemView);
            arabicName = (TextView) itemView.findViewById(R.id.cardArabicName);
            englishName = (TextView) itemView.findViewById(R.id.cardEnglishName);
            image = (ImageView) itemView.findViewById(R.id.cardImage);
            imageButton = (ImageButton) itemView.findViewById(R.id.cardRemove);
        }

        public TextView getArabicName() {
            return arabicName;
        }

        public TextView getEnglishName() {
            return englishName;
        }

        public ImageView getImage() {
            return image;
        }

        public ImageButton getImageButton() {
            return imageButton;
        }
    }
}
