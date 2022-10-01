package com.dresstips.taqmish.Activities;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.FragmentManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.dresstips.taqmish.ADO.SubClassADO;
import com.dresstips.taqmish.Adapters.ClassTypeAdatpter;
import com.dresstips.taqmish.Adapters.TypeLevel;
import com.dresstips.taqmish.Interfaces.ClassTyprRecyclerViewInterface;
import com.dresstips.taqmish.Interfaces.SubTypeDialog;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ClassSubType;
import com.dresstips.taqmish.classes.ClassType;
import com.dresstips.taqmish.dialogs.AddSubItemDialo;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

public class SubType extends AppCompatActivity implements ClassTyprRecyclerViewInterface ,SubTypeDialog{
    TextView mainClassName;
    ImageView classImage;
    TextView  subClassTextview;
    RecyclerView recyclerView;
    FloatingActionButton add;
    StorageReference ref;
    ArrayList data;
    DatabaseReference mDataBaseRef;
    ClassTypeAdatpter mAdapter;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_sub_type);
       data = new ArrayList<ClassSubType>();
        add = findViewById(R.id.addSubClass);
        mDataBaseRef = FirebaseDatabase.getInstance().getReference(ClassSubType.class.getSimpleName()).child(getIntent().getExtras().getString("rootKey"));

        //----------------------------------------------------
        getDataFromFirebase();
        recyclerView = findViewById(R.id.subTypeRecycelr);
        mAdapter = new ClassTypeAdatpter(data,this,this, TypeLevel.SUBTYPE,getIntent().getExtras().getString("rootKey"));
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(mAdapter);

        mainClassName = findViewById(R.id.mainClassName);
        subClassTextview = findViewById(R.id.subclassTextView);
        subClassTextview.setText(R.string.SubClass);
        classImage = findViewById(R.id.classIcon);
        mainClassName.setText( getIntent().getExtras().getString("englishName"));


        //-----------------------------------------------------//
        ref = FirebaseStorage.getInstance().getReference("MainClass/images").child(getIntent().getExtras().getString("imageName"));
//        Picasso.with(this).load(ref.getDownloadUrl().getResult()).into(classImage);
        ref.getDownloadUrl().addOnSuccessListener(new OnSuccessListener<Uri>() {
            @Override
            public void onSuccess(Uri uri) {
                Picasso.with(SubType.this).load(uri).fit().into(classImage);
            }
        });


        add.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                addSubClass(v);
            }
        });
        mDataBaseRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
               mAdapter.notifyDataSetChanged();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });


    }

    private void addSubClass(View v) {

        DialogFragment newFragment = new AddSubItemDialo(getIntent().getExtras().getString("rootKey"),this);
        newFragment.show(getSupportFragmentManager(), "Add Sub Group");

    }

    @Override
    public void onClick(int posetion) {

    }

    public void getDataFromFirebase() {
        mDataBaseRef.get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
               for (DataSnapshot d: dataSnapshot.getChildren())
               {
                   ClassSubType st  = d.getValue(ClassSubType.class);
                   data.add(st);
               }

            }
        });
    }


    @Override
    public void addSubType(ClassSubType st) {
        data.add(st);
        mAdapter.notifyDataSetChanged();
    }
}