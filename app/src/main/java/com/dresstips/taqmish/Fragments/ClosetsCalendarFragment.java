package com.dresstips.taqmish.Fragments;

import android.os.Bundle;

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
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        view = inflater.inflate(R.layout.fragment_closets_calendar, container, false);
        customCalendarView = view.findViewById(R.id.customCalenderView);
        return view;
    }
}