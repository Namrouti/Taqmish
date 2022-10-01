package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ColorGroup;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

public class ColorGroupAdapter extends RecyclerView.Adapter<ColorGroupAdapter.ColorGroupViewHolder> {
    ArrayList<ColorGroup> data;
    Context mContext;
    public ColorGroupAdapter(Context mContext,ArrayList<ColorGroup> data)
    {
        this.data = data;
        this.mContext =mContext;
    }

    @NonNull
    @Override
    public ColorGroupViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view  = LayoutInflater.from(parent.getContext()).inflate(R.layout.color_group_card,parent,false);
        return new ColorGroupViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ColorGroupViewHolder holder, int position) {
            holder.getGroupName().setText(data.get(position).getGroupName());
        General.getStorageRefrence(ColorGroup.class.getSimpleName()).child(data.get(position).getImageName()).getDownloadUrl().addOnSuccessListener(new OnSuccessListener<Uri>() {
            @Override
            public void onSuccess(Uri uri) {
                Picasso.with(mContext).load(uri).fit().into(holder.getGroupImage());
            }
        });
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    public static class ColorGroupViewHolder extends RecyclerView.ViewHolder {
        TextView groupName;
        ImageView groupImage;
        RecyclerView groupColors;
        FloatingActionButton colorGroupAddbtn;

        public ColorGroupViewHolder(@NonNull View itemView) {
            super(itemView);
            groupName = itemView.findViewById(R.id.groupNameTextView);
            groupImage = itemView.findViewById(R.id.group_image);
            groupColors = itemView.findViewById(R.id.colorsInGroup);
            colorGroupAddbtn = itemView.findViewById(R.id.groupAddColorbtn);
        }

        public TextView getGroupName() {
            return groupName;
        }

        public ImageView getGroupImage() {
            return groupImage;
        }

        public RecyclerView getGroupColors() {
            return groupColors;
        }

        public FloatingActionButton getColorGroupAddbtn() {
            return colorGroupAddbtn;
        }
    }
}
