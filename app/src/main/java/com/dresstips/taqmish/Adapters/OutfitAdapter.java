package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.OutfitClass;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

public class OutfitAdapter extends RecyclerView.Adapter<OutfitAdapter.holder> {

    ArrayList<OutfitClass> data;
    Context mContext;

    public OutfitAdapter(ArrayList<OutfitClass> data, Context mContext) {
        this.data = data;
        this.mContext = mContext;
    }

    @NonNull
    @Override
    public OutfitAdapter.holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(mContext).inflate(R.layout.outfit_card,parent,false);
        return new holder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull OutfitAdapter.holder holder, int position) {
        Picasso.with(mContext).load(data.get(position).getTop().getFilePath()).fit().into(holder.getTopImage());
        Picasso.with(mContext).load(data.get(position).getDown().getFilePath()).fit().into(holder.getDownImage());
        Picasso.with(mContext).load(data.get(position).getShoes().getFilePath()).fit().into(holder.getShoos());
        Picasso.with(mContext).load(data.get(position).getAccessories().getFilePath()).fit().into(holder.getWatch());
        holder.mainClass.setText(data.get(position).getMainClass());
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    public class holder extends RecyclerView.ViewHolder {
        ImageView topImage,downImage,shoos,watch, hat, other;
        TextView mainClass;
        View itemView;
        public holder(@NonNull View itemView) {
            super(itemView);
            this.itemView = itemView;
            this.topImage = itemView.findViewById(R.id.topimage);
            this.downImage = itemView.findViewById(R.id.downimage);
            this.shoos = itemView.findViewById(R.id.shoos);
            watch = itemView.findViewById(R.id.watch);
            other = itemView.findViewById(R.id.other);
            mainClass = itemView.findViewById(R.id.mainClasstext);
            hat = itemView.findViewById(R.id.hat);
        }

        public ImageView getTopImage() {
            return topImage;
        }

        public ImageView getDownImage() {
            return downImage;
        }

        public ImageView getShoos() {
            return shoos;
        }

        public ImageView getWatch() {
            return watch;
        }

        public ImageView getHat() {
            return hat;
        }

        public ImageView getOther() {
            return other;
        }

        public TextView getMainClass() {
            return mainClass;
        }

        public View getItemView() {
            return itemView;
        }
    }
}
