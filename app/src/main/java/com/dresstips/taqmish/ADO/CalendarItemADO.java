package com.dresstips.taqmish.ADO;

import android.app.DownloadManager;
import android.provider.ContactsContract;

import androidx.annotation.NonNull;

import com.dresstips.taqmish.classes.CalendarItem;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

import java.nio.channels.SelectableChannel;
import java.util.ArrayList;

public class CalendarItemADO {
    public static ArrayList<CalendarItem> getItemPerMonth(String month,String year)
    {
        ArrayList<CalendarItem> data = new ArrayList<>();
        DatabaseReference ref = General.getDataBaseRefrenece(CalendarItem.class.getSimpleName()).child(ADO.getUserId().getUid());
        ref.orderByChild("year").equalTo(year).orderByChild("month").equalTo(month).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {

                for(DataSnapshot d : snapshot.getChildren())
                {
                    CalendarItem ci = d.getValue(CalendarItem.class);
                    data.add(ci);
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });
        return data;
    }
    public  static  ArrayList<CalendarItem> getItemPerDate(String date)
    {
        ArrayList<CalendarItem> data = new ArrayList<>();
        DatabaseReference ref = General.getDataBaseRefrenece(CalendarItem.class.getSimpleName()).
                child(ADO.getUserId().getUid());
        Query mQuery = ref.orderByChild("date").equalTo(date);
        mQuery.get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                for(DataSnapshot d: dataSnapshot.getChildren())
                {
                    data.add(d.getValue(CalendarItem.class));
                }

            }
        });

        return data;
    }
    public static ArrayList<CalendarItem> selectItemPerTime(String date, String time)
    {
        ArrayList<CalendarItem> montdata = getItemPerDate(date);
        ArrayList<CalendarItem> data = new ArrayList<>();

        for(int i = 0; i< montdata.size(); i++)
        {
            if(montdata.get(i).getTime().equals(time))
            {
                data.add(montdata.get(i));
            }
        }
        return data;
    }
    public static ArrayList<CalendarItem> selectItemPerMonthYear(String month, String year)
    {
        ArrayList<CalendarItem> data = new ArrayList<>();
        DatabaseReference ref = General.getDataBaseRefrenece(CalendarItem.class.getSimpleName()).child(ADO.getUserId().getUid());
        Query mQuery = ref.orderByChild("year").equalTo(year).orderByChild("month").equalTo(month);
        mQuery.get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                for (DataSnapshot d : dataSnapshot.getChildren())
                {
                    data.add(d.getValue(CalendarItem.class));
                }

            }
        });
        return data;
    }
}
