package com.dresstips.taqmish.Adapters;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.models.SimilarImage;

import java.util.List;

public class SimilarImagesAdapter extends RecyclerView.Adapter<SimilarImagesAdapter.ViewHolder> {
    private List<SimilarImage> similarImageList;
    private OnItemClickListener onItemClickListener;

    public interface OnItemClickListener {
        void onItemClick(SimilarImage item);
    }
    public void updateList(List<SimilarImage> images)
    {
        this.similarImageList = images;
    }

    public SimilarImagesAdapter(List<SimilarImage> similarImageList, OnItemClickListener listener) {
        this.similarImageList = similarImageList;
        this.onItemClickListener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_similar_image, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        SimilarImage item = similarImageList.get(position);
        holder.imageView.setImageResource(item.getImageResId());
        holder.sexType.setText(item.getGender());
        holder.season.setText(item.getSeason());

        // Change background or appearance based on selection state
        holder.itemView.setBackgroundColor(item.isSelected() ? Color.LTGRAY : Color.WHITE);

        holder.itemView.setOnClickListener(v -> {
            if (onItemClickListener != null) {
                onItemClickListener.onItemClick(item);
            }
        });
    }

    @Override
    public int getItemCount() {
        return similarImageList.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        ImageView imageView;
        TextView sexType, season;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            imageView = itemView.findViewById(R.id.imageView);
            sexType = itemView.findViewById(R.id.genderTypeTextView);
            season = itemView.findViewById(R.id.seasonTypeTextView);
        }
    }
}
