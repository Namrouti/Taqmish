package com.dresstips.taqmish.dialogs;

import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.Dialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.RadioButton;
import android.widget.RadioGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.ADO.ADO;
import com.dresstips.taqmish.ADO.CalendarItemADO;
import com.dresstips.taqmish.Adapters.DatetimeCalendarItemAdapter;
import com.dresstips.taqmish.Fragments.HomeFragment;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.CalendarItem;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.OutfitClass;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.ValueEventListener;
import com.squareup.picasso.Picasso;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public class saveOutfitDialog extends DialogFragment {
    OutfitClass outfit;
    ArrayList<CalendarItem> itemsOfDateFilter = new ArrayList<>();
    ArrayList<CalendarItem> itemsResultonTimeFilter = new ArrayList<>();
    DatetimeCalendarItemAdapter adapterOfSelectedItem;
    DatetimeCalendarItemAdapter filterOnTimeAdapter;

    RadioButton selectedTime;



    public saveOutfitDialog(OutfitClass outfit)
    {
        this.outfit = outfit;
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        adapterOfSelectedItem = new DatetimeCalendarItemAdapter(this.getContext(), itemsOfDateFilter);
        filterOnTimeAdapter = new DatetimeCalendarItemAdapter(this.getContext(),itemsResultonTimeFilter);
        AlertDialog.Builder builder = new AlertDialog.Builder(this.getContext());
        View saveDailog = LayoutInflater.from(this.getContext()).inflate(R.layout.save_to_calender,null);
        builder.setView(saveDailog);
        builder.setCancelable(true);
        //get all component
        ImageButton showCalendar = saveDailog.findViewById(R.id.showCalendar);
        EditText datetxt = saveDailog.findViewById(R.id.datetxt);
        EditText title = saveDailog.findViewById(R.id.title);
        ImageView topimage = saveDailog.findViewById(R.id.topimage);
        ImageView downimage = saveDailog.findViewById(R.id.downimage);
        ImageView shoos = saveDailog.findViewById(R.id.shoos);
        ImageView watch = saveDailog.findViewById(R.id.watch);
        RadioGroup timeRadioGroup = saveDailog.findViewById(R.id.timeRadioGroup);
        RecyclerView selectedCloset = saveDailog.findViewById(R.id.selectedCloset);
        for(int i=0; i <timeRadioGroup.getChildCount(); i++)
        {
            RadioButton rb = (RadioButton) timeRadioGroup.getChildAt(i);
            rb.setEnabled(false);

        }

        selectedCloset.setAdapter(adapterOfSelectedItem);
        selectedCloset.setLayoutManager(new LinearLayoutManager(getContext(),LinearLayoutManager.HORIZONTAL,false));

        CalendarItem item = new CalendarItem();
        item.setOutfitID(outfit.getId());

        if(outfit.getTop() != null)
        {
            Picasso.with(getContext()).load(outfit.getTop().filePath).into(topimage);
        }
        if(outfit.getDown() != null)
        {
            Picasso.with(getContext()).load(outfit.getDown().filePath).into(downimage);
        }
        if(outfit.getShoes() != null)
        {
            Picasso.with(getContext()).load(outfit.getShoes().filePath).into(shoos);
        }
        if(outfit.getAccessories() != null)
        {
            Picasso.with(getContext()).load(outfit.getAccessories().filePath).into(watch);
        }

        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat sdf = new SimpleDateFormat("dd-MM-yyyy", Locale.getDefault());

        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int year = calendar.get(Calendar.YEAR);
        item.setMonth(String.format("%02d", (month+1)) );
        item.setYear(year + "");
        item.setDay(String.format("%02d", day));
        showCalendar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                DatePickerDialog picker = new DatePickerDialog(saveOutfitDialog.this.getContext(), new DatePickerDialog.OnDateSetListener() {
                    @Override
                    public void onDateSet(DatePicker datePicker, int selectedYear, int selectedmonth, int selectedday) {
                        item.setMonth(String.format("%02d", (selectedmonth+1)) );
                        item.setYear(selectedYear + "");
                        item.setDay(String.format("%02d", selectedday));
                        Calendar calendar = Calendar.getInstance();
                        calendar.set(selectedYear,selectedmonth,selectedday);


                        item.setDate(sdf.format(calendar.getTime()));
                        datetxt.setText(sdf.format(calendar.getTime()));
                    }
                },year,month,day);
                picker.show();

            }
        });

        datetxt.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

            }

            @Override
            public void afterTextChanged(Editable s) {

                General.getDataBaseRefrenece(CalendarItem.class.getSimpleName()).child(ADO.getUserId().getUid())
                        .orderByChild("date").equalTo(s.toString()).addValueEventListener(new ValueEventListener() {
                    @Override
                    public void onDataChange(@NonNull DataSnapshot snapshot) {
                        if(selectedTime != null)
                        {
                            selectedTime.setChecked(false);
                        }
                        if(s.toString().isEmpty())
                        {
                            for(int i=0; i <timeRadioGroup.getChildCount(); i++)
                            {
                                RadioButton rb = (RadioButton) timeRadioGroup.getChildAt(i);
                                rb.setEnabled(false);

                            }
                        }
                        else {
                            for(int i=0; i <timeRadioGroup.getChildCount(); i++)
                            {
                                RadioButton rb = (RadioButton) timeRadioGroup.getChildAt(i);
                                rb.setEnabled(true);

                            }
                        }
                        selectedCloset.setAdapter(adapterOfSelectedItem);
                        itemsOfDateFilter.clear();
                        for(DataSnapshot d: snapshot.getChildren())
                        {
                            itemsOfDateFilter.add(d.getValue(CalendarItem.class));
                            adapterOfSelectedItem.notifyDataSetChanged();
                        }
                    }

                    @Override
                    public void onCancelled(@NonNull DatabaseError error) {

                    }
                });
            }
        });
        datetxt.setText(sdf.format(calendar.getTime()));

        builder.setCancelable(true);

        timeRadioGroup.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                if(checkedId != -1)
                {
                    RadioButton rb = saveDailog.findViewById(checkedId);
                    selectedTime = rb;
                    item.setTime(rb.getText().toString());
                    ArrayList<CalendarItem> temp = (ArrayList<CalendarItem>) itemsOfDateFilter.clone();

                    selectedCloset.setAdapter(filterOnTimeAdapter);
                    itemsResultonTimeFilter.clear();
                    for(CalendarItem item2: temp)
                    {
                        if(item2.getTime().equals(item.getTime()))
                        {
                            itemsResultonTimeFilter.add(item2);
                            filterOnTimeAdapter.notifyDataSetChanged();
                        }
                    }

                }
            }
        });

        builder.setPositiveButton("Save", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {

                item.setDate(datetxt.getText().toString());
                item.setOutfitID(outfit.getId());
                DatabaseReference ref = General.getDataBaseRefrenece(CalendarItem.class.getSimpleName());
                item.setItemID(ref.push().getKey());
                item.setTitle(title.getText().toString());
                ref.child(ADO.getUserId().getUid()).child(item.getItemID()).setValue(item);
                General.getDataBaseRefrenece(OutfitClass.class.getSimpleName()).child(ADO.getUserId().getUid()).child(outfit.getId()).setValue(outfit);

            }
        }).setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {

            }
        });

        return builder.create();
    }


}
