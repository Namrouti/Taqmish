package com.dresstips.taqmish.Adapters;

import android.app.FragmentManager;
import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.fragment.app.DialogFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Activities.ColorActivity;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ColorGroup;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.dialogs.ColorsPickerDialog;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

public class ColorGroupAdapter extends RecyclerView.Adapter<ColorGroupAdapter.ColorGroupViewHolder> {
    ArrayList<ColorGroup> data;
    Context mContext;
    androidx.fragment.app.FragmentManager  fragmentManager;
    public ColorGroupAdapter(Context mContext, ArrayList<ColorGroup> data, androidx.fragment.app.FragmentManager  fragmentManager)
    {
        this.data = data;
        this.mContext =mContext;
        this.fragmentManager = fragmentManager;

    }



    @NonNull
    @Override
    public ColorGroupViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view  = LayoutInflater.from(parent.getContext()).inflate(R.layout.color_group_card,parent,false);
        return new ColorGroupViewHolder(view,data,fragmentManager);
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
        ColorAdapter cAdapter = new ColorAdapter(mContext,data.get(position).getColors());
        LinearLayoutManager llm = new LinearLayoutManager(mContext);
        llm.setOrientation(RecyclerView.HORIZONTAL);
        holder.groupColors.setLayoutManager(llm);
        holder.groupColors.setAdapter(cAdapter);

        holder.getColorGroupAddbtn().setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                DialogFragment dialog = new ColorsPickerDialog(data.get(holder.getAdapterPosition()));
                dialog.show(fragmentManager,"String");
                cAdapter.notifyDataSetChanged();

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

        public ColorGroupViewHolder(@NonNull View itemView, ArrayList<ColorGroup> data, androidx.fragment.app.FragmentManager  fragmentManager) {
            super(itemView);
            groupName = itemView.findViewById(R.id.groupNameTextView);
            groupImage = itemView.findViewById(R.id.group_image);
            groupColors = itemView.findViewById(R.id.colorsInGroup);
            colorGroupAddbtn = itemView.findViewById(R.id.groupAddColorbtn);

            /////////////////////////////////

            //////////////////////////////////////



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
