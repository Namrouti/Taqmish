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

import com.dresstips.taqmish.Interfaces.BodypartHomfragmentInterface;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.BodyParts;
import com.dresstips.taqmish.classes.BodyPartsMain;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnSuccessListener;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

public class BodyPartsAdapter extends RecyclerView.Adapter<BodyPartsAdapter.BodyPartsViewHolder> {

    ArrayList<BodyPartsMain> data;
    Context mContext;
    BodypartHomfragmentInterface pbi;

    public BodyPartsAdapter(ArrayList<BodyPartsMain> data, Context mContext, BodypartHomfragmentInterface pbi) {
        this.data = data;
        this.mContext = mContext;
        this.pbi = pbi;
    }

    @NonNull
    @Override
    public BodyPartsAdapter.BodyPartsViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(mContext).inflate(R.layout.config_item,parent,false);
        return new BodyPartsViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull BodyPartsAdapter.BodyPartsViewHolder holder, int position) {
        holder.getItemText().setText(data.get(position).getEnglishName());
        holder.getItemView().setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                pbi.itemClickedInterface(data.get(holder.getAdapterPosition()));
            }
        });
        Picasso.with(mContext).load(data.get(position).getFilePath()).fit().into(holder.getItemImage());
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    public class BodyPartsViewHolder extends RecyclerView.ViewHolder {
        ImageView itemImage;
        TextView itemText;
        View itemView;
        public BodyPartsViewHolder(@NonNull View itemView) {
            super(itemView);
            itemText = itemView.findViewById(R.id.itemText);
            itemImage = itemView.findViewById(R.id.itemImage);
            this.itemView = itemView;
        }

        public ImageView getItemImage() {
            return itemImage;
        }

        public TextView getItemText() {
            return itemText;
        }

        public View getItemView() {
            return itemView;
        }
    }
}
