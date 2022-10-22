package com.dresstips.taqmish.Fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.cardview.widget.CardView;
import androidx.fragment.app.Fragment;

import com.dresstips.taqmish.Activities.ColorActivity;
import com.dresstips.taqmish.Activities.ManageClasses;
import com.dresstips.taqmish.Activities.SettingActivity;
import com.dresstips.taqmish.R;

public class SettingsFragment extends Fragment {

    CardView colorCard, dressCard;
    View view;

    public SettingsFragment()
    {
        super(R.layout.activity_setting);
    }



    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        view = inflater.inflate(R.layout.activity_setting,container,false);
        colorCard = view.findViewById(R.id.colorCard);
        dressCard = view.findViewById(R.id.dressCard);

        dressCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent manageClass = new Intent(SettingsFragment.this.getContext(), ManageClasses.class);
                startActivity(manageClass);
            }
        });
        colorCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent manageClass = new Intent(SettingsFragment.this.getContext(), ColorActivity.class);
                startActivity(manageClass);
            }
        });
        return  view;

    }
}
