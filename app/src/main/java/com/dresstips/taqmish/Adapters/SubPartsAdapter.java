package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Interfaces.SubPartHomeFragmentInterface;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.Config;
import com.squareup.picasso.Picasso;

import java.util.List;

public class SubPartsAdapter extends RecyclerView.Adapter<SubPartsAdapter.SPViewHolder> {
    List<Config> subParts;
    List<String> subPartsFilePath;
    Context mContext;
    SubPartHomeFragmentInterface spi;

    public SubPartsAdapter(List<Config> subParts, List<String> subPartsFilePath, Context mContext, SubPartHomeFragmentInterface spi) {
        this.subParts = subParts;
        this.subPartsFilePath = subPartsFilePath;
        this.mContext = mContext;
        this.spi = spi;
    }

    @NonNull
    @Override
    public SubPartsAdapter.SPViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(mContext).inflate(R.layout.config_item,parent,false);
        return new SubPartsAdapter.SPViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull SubPartsAdapter.SPViewHolder holder, int position) {
        holder.getItemText().setText(subParts.get(position).getArabicName());
        Picasso.with(mContext).load(subPartsFilePath.get(position)).fit().into(holder.getItemImage());

        holder.getItemView().setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                spi.subPartsClicked(subParts.get(holder.getAdapterPosition()),subPartsFilePath.get(holder.getAdapterPosition()));
            }
        });

    }

    @Override
    public int getItemCount() {
        return subParts.size();
    }

    public class SPViewHolder extends RecyclerView.ViewHolder {
        ImageView itemImage;
        TextView itemText;
        View itemView;
        public SPViewHolder(@NonNull View itemView) {
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
