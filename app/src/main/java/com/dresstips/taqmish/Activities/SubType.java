package com.dresstips.taqmish.Activities;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;

import com.dresstips.taqmish.R;

public class SubType extends AppCompatActivity {
    TextView mainClassName;
    ImageView classImage;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_sub_type);
        mainClassName = findViewById(R.id.mainClassName);
        classImage = findViewById(R.id.classIcon);
        mainClassName.setText( getIntent().getExtras().getString("englishName"));


    }
}