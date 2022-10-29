package com.dresstips.taqmish.Activities;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.DialogFragment;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.dialogs.AddClosetDialog;

public class ClosetActivity extends AppCompatActivity {

    Button addCloset;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_closet2);
        addCloset = findViewById(R.id.addCloset);
        addCloset.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                addCloset(v);
            }
        });
    }

    private void addCloset(View v) {
        DialogFragment dialog = new AddClosetDialog();
        dialog.show(getSupportFragmentManager(),"Add Closet");

    }
}