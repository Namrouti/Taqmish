package com.dresstips.taqmish.Activities;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.CustomCalendarView;

public class ClosetsCalendar extends AppCompatActivity {

    CustomCalendarView customCalenderView;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_closets_calendar);
        customCalenderView = findViewById(R.id.customCalenderView);
    }
}