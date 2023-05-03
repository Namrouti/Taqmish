package com.dresstips.taqmish.Activities;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.os.Bundle;
import android.util.Log;

import com.dresstips.taqmish.ADO.ADO;
import com.dresstips.taqmish.Adapters.OutfitAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.OutfitClass;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;

public class MyClosets extends AppCompatActivity {

    RecyclerView myClosetsRec;
    ArrayList<OutfitClass> data;
    OutfitAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_my_closets);

        myClosetsRec = findViewById(R.id.myClosetsRecy);
        data = new ArrayList<>();
        String uid = ADO.getUserId().getUid();
        String node = OutfitClass.class.getSimpleName();

        General.getDataBaseRefrenece(node + "/" + uid).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                for(DataSnapshot d : snapshot.getChildren())
                {
                    OutfitClass ofc = d.getValue(OutfitClass.class);
                    data.add(ofc);
                }
                adapter.notifyDataSetChanged();

            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });

        adapter = new OutfitAdapter(data,this);
        myClosetsRec.setAdapter(adapter);
        myClosetsRec.setLayoutManager(new LinearLayoutManager(this));




    }
}