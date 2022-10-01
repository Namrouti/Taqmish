package com.dresstips.taqmish.Activities;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.DialogFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.os.Bundle;
import android.view.View;

import com.dresstips.taqmish.Adapters.ColorGroupAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ColorGroup;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.dialogs.ColorGroupDialog;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;

public class ColorActivity extends AppCompatActivity {
    FloatingActionButton addbtn;
    RecyclerView rv;
    ArrayList<ColorGroup> data;
    ColorGroupAdapter mAdapter;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_color);

        addbtn = findViewById(R.id.colorGroupAddbtn);
        rv = findViewById(R.id.colorGroupsRecyclerView);


        data = new ArrayList();
        getData();
        mAdapter = new ColorGroupAdapter(this,data);
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(mAdapter);
        General.getDataBaseRefrenece(ColorGroup.class.getSimpleName()).addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                if(snapshot != null )
                {
                    ColorGroup cg = snapshot.getValue(ColorGroup.class);
                    if(cg != null)
                    {
                        data.add(cg);
                        mAdapter.notifyDataSetChanged();
                    }
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });


        addbtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                addButtonClicked(v);
            }
        });
    }

    private void addButtonClicked(View v) {
        DialogFragment df = new ColorGroupDialog();
        df.show(getSupportFragmentManager(), "Add Color Group");
    }

    public void getData()
    {
        General.getDataBaseRefrenece(ColorGroup.class.getSimpleName()).get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                for(DataSnapshot d : dataSnapshot.getChildren())
                {
                    ColorGroup cg = d.getValue(ColorGroup.class);
                    data.add(cg);
                }
            }
        });
    }
}