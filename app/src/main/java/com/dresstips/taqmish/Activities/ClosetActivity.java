package com.dresstips.taqmish.Activities;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.DialogFragment;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.dresstips.taqmish.ADO.GeneralADO;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ClassType;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.dialogs.AddClosetDialog;

import java.util.ArrayList;

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

        ArrayList<ClassType> mainClassData = GeneralADO.getData(General.getDataBaseRefrenece(ClassType.class.getSimpleName()),ClassType.class);

        String[] maincl  = new String[mainClassData.size()];
        int counter =0;
        for(ClassType ct: mainClassData)
        {
            maincl[counter++] = ct.getArabicName();
            Toast.makeText(this,ct.getArabicName(),Toast.LENGTH_LONG).show();
        }


    }

    private void addCloset(View v) {
        DialogFragment dialog = new AddClosetDialog();
        dialog.show(getSupportFragmentManager(),"Add Closet");

    }
}