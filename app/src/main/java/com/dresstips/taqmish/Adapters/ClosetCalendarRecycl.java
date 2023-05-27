package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.CalendarItem;

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
        holder.getEventName().setText(data.get(position).getItemID());
        holder.getEventTime().setText(data.get(position).getTime());

    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    public class viewHolder extends RecyclerView.ViewHolder {
        TextView eventName, eventDate,eventTime;
        View view;
        public viewHolder(@NonNull View itemView) {
            super(itemView);
            view = itemView;
            eventName = itemView.findViewById(R.id.eventName);
            eventDate = itemView.findViewById(R.id.eventDate);
            eventTime = itemView.findViewById(R.id.eventTime);
        }

        public TextView getEventName() {
            return eventName;
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
    }
}
