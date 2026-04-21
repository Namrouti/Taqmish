package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.net.Uri;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.Filter;
import android.widget.Filterable;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Interfaces.ClosetAdapterHomeFragemntIINterface;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.Closet;
import com.dresstips.taqmish.classes.ColorGroup;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.SiteClosets;
import com.google.android.gms.tasks.OnSuccessListener;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Locale;

public class ClosetsAdapter extends RecyclerView.Adapter<ClosetsAdapter.ClosetViewHolder> implements Filterable {
    public ArrayList<SiteClosets> data;
    ArrayList<SiteClosets> datafull;
    Context mContext;
    ClosetAdapterHomeFragemntIINterface mInterface;

    public ClosetsAdapter(ArrayList<SiteClosets> data, Context mContext,
            ClosetAdapterHomeFragemntIINterface mInterface) {
        this.data = data;
        datafull = new ArrayList(data);
        this.mContext = mContext;
        this.mInterface = mInterface;
    }

    public void dataCanged() {
        this.datafull = new ArrayList<>(data);
    }

    @NonNull
    @Override
    public ClosetsAdapter.ClosetViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.cloest_item, parent, false);
        return new ClosetViewHolder(view);
    }

    public void setData(ArrayList<SiteClosets> newData) {
        this.data = newData;
        this.datafull = new ArrayList<>(newData);
    }

    public void filterByType(String type) {
        data.clear();
        if (type == null || type.equals("All")) {
            data.addAll(datafull);
        } else {
            for (SiteClosets item : datafull) {
                if (matchesType(item, type)) {
                    data.add(item);
                }
            }
        }
        notifyDataSetChanged();
    }

    private boolean matchesType(SiteClosets item, String type) {
        if (item == null) {
            return false;
        }
        String bodyPart = item.getBodyPart() != null ? item.getBodyPart().toLowerCase(Locale.ROOT) : "";
        String subParts = item.getSubParts() != null ? item.getSubParts().toLowerCase(Locale.ROOT) : "";

        switch (type) {
            case "Top":
                return bodyPart.contains("علوي");
            case "Bottom":
                return bodyPart.contains("سفلي");
            case "Shoes":
                return subParts.contains("حذاء") || bodyPart.contains("اكسسوارات");
            case "Accessories":
                return subParts.contains("accessories") || bodyPart.contains("اكسسوارات") || subParts.contains("watch")
                        || subParts.contains("bag") || subParts.contains("jewelry") || subParts.contains("hat");
            case "Bag":
                return subParts.contains("bag") || subParts.contains("حقائب");
            default:
                return false;
        }
    }

    @Override
    public void onBindViewHolder(@NonNull ClosetsAdapter.ClosetViewHolder holder, int position) {

        Picasso.with(mContext).load(data.get(position).getFilePath()).fit().into(holder.getItemImage());

        holder.getItemView().setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mInterface.itemClicked(data.get(holder.getAdapterPosition()), holder.getItemImage());
            }
        });

    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    @Override
    public Filter getFilter() {
        return bodyFillter;
    }

    Filter bodyFillter = new Filter() {
        @Override
        protected FilterResults performFiltering(CharSequence constraint) {

            ArrayList<SiteClosets> filteredList = new ArrayList();

            if (constraint.toString().isEmpty()) {
                filteredList.addAll(datafull);
            } else {
                String filteredPattern = constraint.toString();
                Log.d("Fillter pattern", filteredPattern);
                Log.d("DataFull Size", datafull.size() + "");
                for (SiteClosets item : datafull) {
                    if (matchesType(item, filteredPattern)) {
                        filteredList.add(item);
                    }
                }
            }
            FilterResults resul = new FilterResults();
            resul.values = filteredList;
            return resul;
        }

        @Override
        protected void publishResults(CharSequence constraint, FilterResults results) {
            data.clear();
            data.addAll((Collection<? extends SiteClosets>) results.values);
            notifyDataSetChanged();
            Log.d("End of publishResults the data size" + data.size(), "Message");

        }
    };

    public class ClosetViewHolder extends RecyclerView.ViewHolder {
        ImageView itemImage;
        View itemView;

        public ClosetViewHolder(@NonNull View itemView) {
            super(itemView);
            itemImage = itemView.findViewById(R.id.itemImage);
            this.itemView = itemView;

        }

        public View getItemView() {
            return itemView;
        }

        public ImageView getItemImage() {
            return itemImage;
        }

    }
}
