package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.ADO.ADO;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.CalendarItem;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.OutfitClass;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.Date;

public class DatetimeCalendarItemAdapter extends RecyclerView.Adapter<DatetimeCalendarItemAdapter.holder> {
    Context mContext;
    ArrayList<CalendarItem> data;

    public DatetimeCalendarItemAdapter(Context mContext, ArrayList<CalendarItem> data)
    {
        this.mContext = mContext;
        this.data = data;
    }

    @NonNull
    @Override
    public holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(mContext).inflate(R.layout.mor_eve_nig_item_layout,null);
        return new holder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull holder holder, int position) {
        holder.getTitle().setText(data.get(position).getTitle());
        if(data.get(position).getTime().equals("Morning"))
        {
            holder.getContainer().setBackgroundColor(mContext.getResources().getColor(R.color.blue));
        }
        else if(data.get(position).getTime().equals("Evening"))
        {
            holder.getContainer().setBackgroundColor(mContext.getResources().getColor(R.color.orange));
        }
        else if(data.get(position).getTime().equals("Night"))
        {
            holder.getContainer().setBackgroundColor(mContext.getResources().getColor(R.color.black));
        }
        String uid = ADO.getUserId().getUid();
        General.getDataBaseRefrenece(OutfitClass.class.getSimpleName()).child(uid).child(data.get(position).getOutfitID()).get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                OutfitClass outfit = dataSnapshot.getValue(OutfitClass.class);
                if(outfit != null)
                {
                    if(outfit.getTop() != null)
                    {
                        Picasso.with(mContext).load(outfit.getTop().getFilePath()).fit().into(holder.getTopimage());
                    }
                    if(outfit.getDown() != null)
                    {
                        Picasso.with(mContext).load(outfit.getDown().getFilePath()).fit().into(holder.getDownimage());
                    }
                    if(outfit.getShoes() != null)
                    {
                        Picasso.with(mContext).load(outfit.getShoes().getFilePath()).fit().into(holder.getShoos());
                    }
                    if(outfit.getAccessories() != null)
                    {
                        Picasso.with(mContext).load(outfit.getAccessories().getFilePath()).fit().into(holder.getWatch());
                    }
                }

            }
        });

    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    public class holder extends RecyclerView.ViewHolder {
        TextView title;
        ImageView topimage, downimage, shoos, watch;
        View itemView;
        LinearLayout container;

        public holder(@NonNull View itemView) {
            super(itemView);
            title = itemView.findViewById(R.id.title);
            topimage = itemView.findViewById(R.id.topimage);
            downimage = itemView.findViewById(R.id.downimage);
            shoos = itemView.findViewById(R.id.shoos);
            watch = itemView.findViewById(R.id.watch);
            container = itemView.findViewById(R.id.container);
            this.itemView = itemView;
        }

        public TextView getTitle() {
            return title;
        }

        public ImageView getTopimage() {
            return topimage;
        }

        public ImageView getDownimage() {
            return downimage;
        }

        public ImageView getShoos() {
            return shoos;
        }

        public ImageView getWatch() {
            return watch;
        }

        public View getItemView() {
            return itemView;
        }

        public LinearLayout getContainer() {
            return container;
        }
    }
}
