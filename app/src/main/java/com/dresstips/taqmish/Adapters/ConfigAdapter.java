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

import com.dresstips.taqmish.Interfaces.MainClassHomeFragmentInterface;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.Config;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.MainClass;
import com.google.android.gms.tasks.OnSuccessListener;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.List;

public class ConfigAdapter extends RecyclerView.Adapter<ConfigAdapter.ConfigViewHolder> {
   ArrayList<MainClass> data;
    Context mContext;
    MainClassHomeFragmentInterface mci;

    public ConfigAdapter(ArrayList<MainClass> data, Context mContext, MainClassHomeFragmentInterface mci) {
      this.data = data;
        this.mContext = mContext;
        this.mci = mci;
    }

    @NonNull
    @Override
    public ConfigAdapter.ConfigViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(mContext).inflate(R.layout.config_item,parent,false);
        return new ConfigViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ConfigAdapter.ConfigViewHolder holder, int position) {
        holder.getItemText().setText(data.get(position).getArabicName());
        Picasso.with(mContext).load(data.get(position).getFilePath()).fit().into(holder.getItemImage());
        holder.getItemView().setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mci.mainClassClicked(data.get(holder.getAdapterPosition()));
            }
        });

    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    public class ConfigViewHolder extends RecyclerView.ViewHolder {
        ImageView itemImage;
        TextView itemText;
        View itemView;

        public View getItemView() {
            return itemView;
        }

        public ConfigViewHolder(@NonNull View itemView) {
            super(itemView);
            itemImage = itemView.findViewById(R.id.itemImage);
            itemText = itemView.findViewById(R.id.itemText);
            this.itemView = itemView;
        }

        public ImageView getItemImage() {
            return itemImage;
        }

        public TextView getItemText() {
            return itemText;
        }

    }
}
