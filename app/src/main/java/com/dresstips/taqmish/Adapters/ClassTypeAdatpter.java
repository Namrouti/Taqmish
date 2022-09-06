package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;


import com.dresstips.taqmish.Interfaces.ClassTyprRecyclerViewInterface;
import com.dresstips.taqmish.classes.ClassType;
import com.dresstips.taqmish.R;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

public class ClassTypeAdatpter extends RecyclerView.Adapter<ClassTypeAdatpter.TypeViewHolder> {

    ArrayList<ClassType> types;
    StorageReference storageRef ;
    Context mContext;
    public static  final String IMAGE_KEY = "com.dresstips.taqmish.IMAGE_KEY";
    public static final String IMAGE_URL = "com.dresstips.taqmish.IMAGE_URL";
    ClassTyprRecyclerViewInterface mInterface;
    public ClassTypeAdatpter(ArrayList<ClassType> types, Context context, ClassTyprRecyclerViewInterface mInterface)
    {
        this.types = types;
        mContext = context;
        storageRef = FirebaseStorage.getInstance().getReference("/MainClass/Images");
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
