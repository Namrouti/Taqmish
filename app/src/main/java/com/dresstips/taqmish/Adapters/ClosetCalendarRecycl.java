package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
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
import com.google.firebase.database.DatabaseReference;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

public class ClosetCalendarRecycl extends RecyclerView.Adapter<ClosetCalendarRecycl.viewHolder> {
    Context mContext;
    ArrayList<CalendarItem> data;

    public ClosetCalendarRecycl(Context mContext, ArrayList<CalendarItem> data)
    {
        this.mContext = mContext;
        this.data = data;
    }


    @NonNull
    @Override
    public viewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(mContext).inflate(R.layout.show_event_rwo_layout,parent,false);
        return new viewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull viewHolder holder, int position) {
        holder.getEventDate().setText(data.get(position).getDate());
     //   holder.getEventName().setText(data.get(position).getItemID());
        holder.getEventTime().setText(data.get(position).getTime());
        holder.getTitle().setText(data.get(position).getTitle());
        String uid = ADO.getUserId().getUid();
        General.getDataBaseRefrenece(OutfitClass.class.getSimpleName()).child(uid).child(data.get(position).getOutfitID()).get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                OutfitClass outfit = dataSnapshot.getValue(OutfitClass.class);
                if(outfit != null)
                {
                    if(outfit.getDown() != null)
                    {
                        Picasso.with(mContext).load(outfit.getDown().getFilePath()).fit().into(holder.getDownimage());

                    }
                    if(outfit.getTop() != null)
                    {
                        Picasso.with(mContext).load(outfit.getTop().getFilePath()).fit().into(holder.getTopimage());

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

    public class viewHolder extends RecyclerView.ViewHolder {
        TextView title, eventDate,eventTime;
        ImageView topimage,downimage,shoos,watch;
        View view;
        public viewHolder(@NonNull View itemView) {
            super(itemView);
            view = itemView;
            title = itemView.findViewById(R.id.title);
            eventDate = itemView.findViewById(R.id.eventDate);
            eventTime = itemView.findViewById(R.id.eventTime);
            topimage = itemView.findViewById(R.id.topimage);
            downimage = itemView.findViewById(R.id.downimage);
            shoos = itemView.findViewById(R.id.shoos);
            watch = itemView.findViewById(R.id.watch);

        }

        public TextView getTitle() {
            return title;
        }

        public TextView getEventDate() {
            return eventDate;
        }

        public TextView getEventTime() {
            return eventTime;
        }

        public View getView() {
            return view;
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
    }
}
