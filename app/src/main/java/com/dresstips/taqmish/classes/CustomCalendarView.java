package com.dresstips.taqmish.classes;

import android.app.AlertDialog;
import android.app.TimePickerDialog;
import android.content.Context;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.GridView;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.TimePicker;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.ADO.ADO;
import com.dresstips.taqmish.Adapters.ClosetCalendarRecycl;
import com.dresstips.taqmish.Adapters.CustomCalendarAdapter;
import com.dresstips.taqmish.Adapters.DatetimeCalendarItemAdapter;
import com.dresstips.taqmish.R;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class CustomCalendarView extends LinearLayout {
    ImageButton next, prev;
    TextView currentDatetxt,date;
    GridView gridView;
    CustomCalendarAdapter mCustomCalendarAdapter;
    RecyclerView morningRecy, eveningRecy,nightRecy;
    ArrayList<CalendarItem> morningList,eveninglist,nightList;
    DatetimeCalendarItemAdapter morningAdapter, eveningAdapter, nightAdapter;

    private static  final int MAX_CALENDAR_DAYS = 42;
    Calendar calendar = Calendar.getInstance(Locale.ENGLISH);
    Context context;
    List<Date> dates = new ArrayList<>();
    List<CalendarItem> items = new ArrayList<>();
    SimpleDateFormat dateFormat = new SimpleDateFormat("dd-MM-yyyy", Locale.ENGLISH);
    SimpleDateFormat monthFormat = new SimpleDateFormat("MM", Locale.ENGLISH);
    SimpleDateFormat yearFormat = new SimpleDateFormat("yyyy", Locale.ENGLISH);
    SimpleDateFormat eventDateFormat = new SimpleDateFormat("DD-MM-YYYY",Locale.ENGLISH);
    ArrayList<CalendarItem> monthItems = new ArrayList<>();
    ArrayList<CalendarItem> dayItems = new ArrayList<>();

    public CustomCalendarView(Context context) {
        super(context);
        monthItems = new ArrayList<>();
        dayItems = new ArrayList<>();
    }

    public CustomCalendarView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        this.context = context;
        initializeLayout();
        setUpCalendar();
        final AlertDialog alertDialog = null;

        prev.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                calendar.add(Calendar.MONTH, -1);
                setUpCalendar();
               
            }
        });
        next.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                calendar.add(Calendar.MONTH, 1);
                setUpCalendar();
            }
        });

        gridView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                
         /*       AlertDialog.Builder builder = new AlertDialog.Builder(context);
                builder.setCancelable(true);
                View addView = LayoutInflater.from(context).inflate(R.layout.add_newevent_layout, null);
                EditText eventName = addView.findViewById(R.id.event_id);
                TextView eventTime = addView.findViewById(R.id.eventtime);
                ImageView setTime = addView.findViewById(R.id.seteventtime);
                Button addEvent = addView.findViewById(R.id.addevent);
                 setTime.setOnClickListener(new OnClickListener() {
                     @Override
                     public void onClick(View v) {
                         Calendar calendar = Calendar.getInstance();
                         int hour = calendar.get(Calendar.HOUR_OF_DAY);
                         int minits = calendar.get(Calendar.MINUTE);
                         TimePickerDialog timePickerDialog = new TimePickerDialog(addView.getContext(), com.hbb20.R.style.Theme_AppCompat_Dialog,
                                 new TimePickerDialog.OnTimeSetListener() {
                                     @Override
                                     public void onTimeSet(TimePicker view, int hourOfDay, int minute) {

                                         Calendar c = Calendar.getInstance();
                                         c.set(Calendar.HOUR_OF_DAY,hourOfDay);
                                         c.set(Calendar.MINUTE, minits);
                                         c.setTimeZone(TimeZone.getDefault());
                                         SimpleDateFormat hformat = new SimpleDateFormat("K:mm a",Locale.ENGLISH);
                                         String event_time = hformat.format(c.getTime());
                                         eventTime.setText(event_time);
                                     }
                                 },hour,minits,false);

                         timePickerDialog.show();
                     }
                 });
                 String date = eventDateFormat.format(dates.get(position));
                 String month = monthFormat.format(dates.get(position));
                 String year = yearFormat.format(dates.get(position));
                 addEvent.setOnClickListener(new OnClickListener() {
                     @Override
                     public void onClick(View v) {
                         saveEvent(eventName.getText().toString(),eventTime.getText().toString(),date,month,year);
                         setUpCalendar();


                     }
                 });
                 builder.setView(addView);
                 builder.create().show();*/
                String date = dateFormat.format(dates.get(position));
                CustomCalendarView.this.date.setText(date);
                CollectItemByDate(date);
                morningList.clear();
                eveninglist.clear();
                nightList.clear();
                for(int i = 0; i< dayItems.size(); i++)
                {
                    if(dayItems.get(i).getTime() != null)
                    {
                        if(dayItems.get(i).getTime().equals("Evening"))
                        {
                            eveninglist.add(dayItems.get(i));
                        }
                        else if (dayItems.get(i).getTime().equals("Morning"))
                        {
                            morningList.add(dayItems.get(i));
                        }
                        else if (dayItems.get(i).getTime().equals("Night"))
                        {
                            nightList.add(dayItems.get(i));
                        }
                    }

                }
                morningAdapter.notifyDataSetChanged();
                eveningAdapter.notifyDataSetChanged();
                nightAdapter.notifyDataSetChanged();

            }
        });

        gridView.setOnItemLongClickListener(new AdapterView.OnItemLongClickListener() {
            @Override
            public boolean onItemLongClick(AdapterView<?> parent, View view, int position, long id) {
                String date = dateFormat.format(dates.get(position));
                CollectItemByDate(date);
                AlertDialog.Builder builder = new AlertDialog.Builder(context);
                builder.setCancelable(true);
                View showEventView = LayoutInflater.from(context).inflate(R.layout.show_calendaritem_layout,null);
                RecyclerView rv = showEventView.findViewById(R.id.calendarItemRecy);
                ClosetCalendarRecycl adapter = new ClosetCalendarRecycl(showEventView.getContext(),dayItems);
                rv.setLayoutManager(new LinearLayoutManager(showEventView.getContext()));
                rv.setAdapter(adapter);
                adapter.notifyDataSetChanged();
                builder.setView(showEventView);
                builder.create().show();
                return true;
            }
        });
    }

    public  void saveEvent(String event, String time, String date,String month, String year)
    {
        // add event to firebase database

    }

    public CustomCalendarView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        this.context = context;

    }

    public void initializeLayout()
    {
        LayoutInflater inflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        View view = inflater.inflate(R.layout.costum_calender_view, this);
        prev = view.findViewById(R.id.prev);
        next = view.findViewById(R.id.next);
        currentDatetxt = view.findViewById(R.id.currentDatetxt);
        gridView = view.findViewById(R.id.gridView);
        date = view.findViewById(R.id.date);

        morningList = new ArrayList<>();
        eveninglist = new ArrayList<>();
        nightList = new ArrayList<>();

        morningAdapter = new DatetimeCalendarItemAdapter(getContext(),morningList);
        eveningAdapter = new DatetimeCalendarItemAdapter(getContext(),eveninglist);
        nightAdapter = new DatetimeCalendarItemAdapter(getContext(),nightList);

        morningRecy = view.findViewById(R.id.morningRecyl);
        morningRecy.setAdapter(morningAdapter);
        morningRecy.setLayoutManager(new LinearLayoutManager(this.getContext(),LinearLayoutManager.HORIZONTAL,false));

        eveningRecy = view.findViewById(R.id.eveningRecyl);
        eveningRecy.setAdapter(eveningAdapter);
        eveningRecy.setLayoutManager(new LinearLayoutManager(this.getContext(),LinearLayoutManager.HORIZONTAL,false));

        nightRecy = view.findViewById(R.id.nightRecyl);
        nightRecy.setAdapter(nightAdapter);
        nightRecy.setLayoutManager(new LinearLayoutManager(this.getContext(),LinearLayoutManager.HORIZONTAL,false));

    }
    public void setUpCalendar(){
        String currentDate = dateFormat.format(calendar.getTime());
        this.currentDatetxt.setText(monthFormat.format(calendar.getTime()) + "/" + yearFormat.format(calendar.getTime()));
        dates.clear();
        Calendar monthCalendar = (Calendar) calendar.clone();
        monthCalendar.set(Calendar.DAY_OF_MONTH,1);
        int firstDayOfMonth = monthCalendar.get(Calendar.DAY_OF_WEEK) - 1;
        monthCalendar.add(Calendar.DAY_OF_MONTH, -firstDayOfMonth);

        //bring the closet of month from firebase
        mCustomCalendarAdapter = new CustomCalendarAdapter(context,dates,calendar,monthItems);
        gridView.setAdapter(mCustomCalendarAdapter);
        collectClosetsPerMonth(monthFormat.format(calendar.getTime()),yearFormat.format(calendar.getTime()),mCustomCalendarAdapter);

        while (dates.size() < MAX_CALENDAR_DAYS)
        {
            dates.add(monthCalendar.getTime());
            monthCalendar.add(Calendar.DAY_OF_MONTH, 1);
        }


    }

    public void collectClosetsPerMonth(String month, String year, CustomCalendarAdapter adapter)
    {
        //get all items from firebase based on month
        String uid = ADO.getUserId().getUid();
        monthItems.clear();
        General.getDataBaseRefrenece(CalendarItem.class.getSimpleName()).child(uid).get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                for(DataSnapshot d : dataSnapshot.getChildren())
                {
                    CalendarItem ci = d.getValue(CalendarItem.class);
                    if(ci.getMonth().equals(month) && ci.getYear().equals(year))
                    {
                        monthItems.add(ci);

                    }
                }
                adapter.notifyDataSetChanged();

            }
        });

    }
    public ArrayList<CalendarItem> CollectItemByDate(String date)
    {
        // get items from firebase based on date
        dayItems.clear();
        for(int i =0; i < monthItems.size(); i ++)
        {
            if(monthItems.get(i).getDate().equals(date))
            {
                dayItems.add(monthItems.get(i));
            }
        }


        return dayItems;
    }
}
