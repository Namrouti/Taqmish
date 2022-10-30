package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.R;

import java.util.ArrayList;

public class ColorAdapter extends RecyclerView.Adapter<ColorAdapter.ColorViewHolder> {
    ArrayList<String> data;
    Context mContext;
    public  ColorAdapter(Context mContext, ArrayList<String> data)
    {
        this.mContext = mContext;
        this.data = data;
    }

    @NonNull
    @Override
    public ColorAdapter.ColorViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.color_card,null);
        return new ColorViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ColorAdapter.ColorViewHolder holder, int position) {
       int color = Color.parseColor(data.get(position));
       holder.getColorView().setBackgroundColor(color);
       holder.getColorRemove().setOnClickListener(new View.OnClickListener() {
           @Override
           public void onClick(View v) {
              data.remove(holder.getAdapterPosition());
              ColorAdapter.this.notifyDataSetChanged();

           }
       });
       holder.getColorView().setOnTouchListener(new View.OnTouchListener() {
           @Override
           public boolean onTouch(View v, MotionEvent event) {
               if(event.getAction() == MotionEvent.ACTION_DOWN)
               {
                   holder.getColorRemove().setVisibility(View.VISIBLE);
               }

               return false;
           }
       });
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    public static class ColorViewHolder extends RecyclerView.ViewHolder {
        Button colorRemove;
        View colorView;
        public ColorViewHolder(@NonNull View itemView) {
            super(itemView);
            colorRemove = itemView.findViewById(R.id.colorRemove);
            colorView = itemView.findViewById(R.id.colorView);

        }

        public Button getColorRemove() {
            return colorRemove;
        }

        public View getColorView() {
            return colorView;
        }
    }
    public void getSpinnerData()
}
