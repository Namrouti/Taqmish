package com.dresstips.taqmish.Activities;

import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import com.dresstips.taqmish.R;

public class SettingActivity extends AppCompatActivity {

    CardView colorCard, dressCard,closet;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_setting);

        closet = findViewById(R.id.setting);
        colorCard = findViewById(R.id.colorCard);
        dressCard = findViewById(R.id.dressCard);
        dressCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent manageClass = new Intent(SettingActivity.this, ManageClasses.class);
                startActivity(manageClass);
            }
        });
        colorCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent manageClass = new Intent(SettingActivity.this, ClosetActivity.class);
                startActivity(manageClass);
            }
        });
        closet.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent manageClass = new Intent(SettingActivity.this, ClosetActivity.class);
                startActivity(manageClass);
            }
        });
    }
}