package com.dresstips.taqmish.Adapters;

import android.annotation.SuppressLint;
import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;


import com.dresstips.taqmish.Interfaces.ClassTyprRecyclerViewInterface;
import com.dresstips.taqmish.classes.ClassSubType;
import com.dresstips.taqmish.classes.ClassType;
import com.dresstips.taqmish.R;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

public class ClassTypeAdatpter<T> extends RecyclerView.Adapter<ClassTypeAdatpter.TypeViewHolder> {

    ArrayList<T> types;
    StorageReference storageRef ;
    Context mContext;
    ClassTyprRecyclerViewInterface mInterface;
    TypeLevel level;

    public ClassTypeAdatpter(ArrayList<T> types, Context context, ClassTyprRecyclerViewInterface mInterface,TypeLevel level)
    {
        this.level = level;
        this.types = types;
        mContext = context;
        switch (level)
        {
            case MAIN:{
                storageRef = FirebaseStorage.getInstance().getReference("/MainClass/images");
                break;
            }
            case SUBTYPE:{
                storageRef = FirebaseStorage.getInstance().getReference("SubClass/images");
                break;
            }
        }

        this.mInterface = mInterface;


    }

    @NonNull
    @Override
    public ClassTypeAdatpter.TypeViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.classtype_card,parent,false);
        return new TypeViewHolder(v,mInterface);
    }

    @Override
    public void onBindViewHolder(@NonNull ClassTypeAdatpter.TypeViewHolder holder, int position) {

        switch (level){
            case MAIN: {
                ClassType classType = (ClassType) types.get(position);
                holder.getArabicName().setText(classType.getArabicName());
                holder.getEnglishName().setText(classType.getEnglishName());
                storageRef.child(classType.getImageName()).getDownloadUrl().addOnSuccessListener(new OnSuccessListener<Uri>() {
                    @Override
                    public void onSuccess(Uri uri) {
                        Picasso.with(mContext).load(uri).fit().into(holder.getImage());
                    }
                });
                break;
            }
            case SUBTYPE:{
                ClassSubType subType = (ClassSubType) types.get(position);
                holder.getEnglishName().setText(subType.getEnglishName());
                holder.getArabicName().setText(subType.getArabicName());
                storageRef.child(subType.getImageKey()).getDownloadUrl().addOnSuccessListener(new OnSuccessListener<Uri>() {
                    @Override
                    public void onSuccess(Uri uri) {
                        Picasso.with(mContext).load(uri).fit().into(holder.getImage());
                    }
                });
                break;
            }
        }




    }

    @Override
    public int getItemCount() {
        return types.size();
    }

    public static class TypeViewHolder extends RecyclerView.ViewHolder {
        TextView arabicName,englishName;
        ImageView image;
        ImageButton imageButton;
        @SuppressLint("ResourceAsColor")
        public TypeViewHolder(@NonNull View itemView, ClassTyprRecyclerViewInterface mInterface) {
            super(itemView);
            arabicName = (TextView) itemView.findViewById(R.id.cardArabicName);
            englishName = (TextView) itemView.findViewById(R.id.cardEnglishName);
            image = (ImageView) itemView.findViewById(R.id.cardImage);
            imageButton = (ImageButton) itemView.findViewById(R.id.cardRemove);
            itemView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    mInterface.onClick(getAdapterPosition());
                }
            });
            itemView.setBackgroundColor(android.R.color.holo_green_light);
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
