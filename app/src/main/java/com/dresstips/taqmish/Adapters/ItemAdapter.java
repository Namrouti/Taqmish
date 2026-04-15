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
import com.dresstips.taqmish.models.Item;
import com.dresstips.taqmish.models.SimilarImage;
import com.squareup.picasso.Picasso;

import java.util.List;

public class ItemAdapter extends RecyclerView.Adapter<ItemAdapter.ItemViewHolder> {

    private List<Item> itemList;
    private Context context;
    public interface OnItemClicked {
        void onItemClick(Item item);
    }

    public ItemAdapter(List<Item> itemList,Context context, OnItemClicked onClickListener) {
        this.itemList = itemList;
    }


    @NonNull
    @Override
    public ItemAdapter.ItemViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_row, parent, false);
        return new ItemViewHolder(view);
    }

    @Override
    public void onBindViewHolder( ItemViewHolder holder, int position) {
        Item item = itemList.get(position);
        holder.titleTextView.setText(item.getTitel());
        holder.dateTextView.setText(item.getAddDate());
        holder.categoryTextView.setText(item.getCategory().toString());
        holder.typeTextView.setText(item.getType().toString());

        // Load image using Picasso
        Picasso.with(context)
                .load(item.getFilePath()).fit() // Firebase Storage URL
                .into(holder.itemImageView);
    }

    @Override
    public int getItemCount() {
        return itemList.size();
    }

    public void updateList(List<Item> newList) {
        itemList = newList;
        notifyDataSetChanged();
    }

    public static class ItemViewHolder extends RecyclerView.ViewHolder {
        TextView titleTextView, dateTextView, categoryTextView, typeTextView;
        ImageView itemImageView;

        public ItemViewHolder( View itemView) {
            super(itemView);
            titleTextView = itemView.findViewById(R.id.titleTextView);
            dateTextView = itemView.findViewById(R.id.dateTextView);
            categoryTextView = itemView.findViewById(R.id.categoryTextView);
            typeTextView = itemView.findViewById(R.id.typeTextView);
            itemImageView = itemView.findViewById(R.id.itemImageView);
        }
    }
}