package com.dresstips.taqmish.Fragments;

import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.CustomCalendarView;


public class ClosetsCalendarFragment extends Fragment {

    CustomCalendarView customCalendarView;
    View view;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        view = inflater.inflate(R.layout.fragment_closets_calendar, container, false);
        customCalendarView = view.findViewById(R.id.customCalenderView);
        return view;
    }

    @Override
    public void onResume() {
        super.onResume();
        if (customCalendarView != null) {
            customCalendarView.setUpCalendar();
        }
    }
}