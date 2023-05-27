package com.dresstips.taqmish.Adapters;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.CalendarItem;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class CustomCalendarAdapter extends ArrayAdapter {

    List<Date> dates;
    Calendar currentDate;
    List<CalendarItem> events;
    LayoutInflater inflater;
    public CustomCalendarAdapter(@NonNull Context context,List<Date> dates, Calendar currentDate, List<CalendarItem> events ) {
        super(context, R.layout.single_cell_layout);
        this.dates = dates;
        this.currentDate = currentDate;
        this.events = events;
        inflater = LayoutInflater.from(context);
    }

    @NonNull
    @Override
    public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        Date monthDate = dates.get(position);
        Calendar dateCalendar = Calendar.getInstance();
        dateCalendar.setTime(monthDate);
        int dayNo = dateCalendar.get(Calendar.DAY_OF_MONTH);
        int displayMonth = dateCalendar.get(Calendar.MONTH) + 1;
        int displayYer = dateCalendar.get(Calendar.YEAR);
        int currentMonth = currentDate.get(Calendar.MONTH) + 1;
        int currentYear = currentDate.get(Calendar.YEAR);


        if(convertView == null)
        {
            convertView = inflater.inflate(R.layout.single_cell_layout,null);
        }

        if(displayMonth == currentMonth && displayYer == currentYear)
        {
            convertView.setBackgroundColor(getContext().getResources().getColor(R.color.green));
        }
        else
        {
            convertView.setBackgroundColor(Color.parseColor("#aaaaaa"));
        }

        TextView dayNotxt = convertView.findViewById(R.id.calendar_day);
        TextView eventNotxt = convertView.findViewById(R.id.event_id);
        dayNotxt.setText(String.valueOf(dayNo));
        Calendar eventCalendar = Calendar.getInstance();
        ArrayList<String> arrayList = new ArrayList<>();
        for(int i =0 ; i < events.size(); i++)
        {
            eventCalendar.setTime(convertStringToDate(events.get(i).getDate()));
            if(dayNo == eventCalendar.get(Calendar.DAY_OF_MONTH) && displayMonth == eventCalendar.get(Calendar.MONTH) + 1
            && displayYer == eventCalendar.get(Calendar.YEAR))
            {
                arrayList.add(events.get(i).getItemID());
                eventNotxt.setText(arrayList.size() + " Closets");
            }
        }


        return convertView;
    }
    public Date convertStringToDate(String eventDate)
    {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-DD", Locale.ENGLISH);
        Date date = null;
        try
        {
            date = format.parse(eventDate);
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return date;
    }

    @Override
    public int getCount() {
        return dates.size();
    }

    @Override
    public int getPosition(@Nullable Object item) {
        return dates.indexOf(item);
    }

    @Nullable
    @Override
    public Object getItem(int position) {
        return dates.get(position);
    }
}
