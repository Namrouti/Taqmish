package com.dresstips.taqmish.Activities;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.FragmentManager;
import androidx.recyclerview.widget.RecyclerView;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import com.dresstips.taqmish.ADO.SubClassADO;
import com.dresstips.taqmish.Adapters.ClassTypeAdatpter;
import com.dresstips.taqmish.Interfaces.ClassTyprRecyclerViewInterface;
import com.dresstips.taqmish.Interfaces.SubTypeDialog;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ClassSubType;
import com.dresstips.taqmish.classes.ClassType;
import com.dresstips.taqmish.dialogs.AddSubItemDialo;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.squareup.picasso.Picasso;

public class SubType extends AppCompatActivity implements ClassTyprRecyclerViewInterface, SubTypeDialog {
    TextView mainClassName;
    ImageView classImage;
    TextView  subClassTextview;
    RecyclerView recyclerView;
    FloatingActionButton add;
    SubClassADO ado;
    StorageReference ref;
    Uri uri;
    DatabaseReference dbRef;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_sub_type);

        add = findViewById(R.id.addSubClass);
        recyclerView = findViewById(R.id.subTypeRecycelr);
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

        getDataFromFirebase();
        add.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                addSubClass(v);
            }
        });

    }

    private void addSubClass(View v) {

        DialogFragment newFragment = new AddSubItemDialo(this);
        newFragment.show(getSupportFragmentManager(), "Add Sub Grou");

    }

    @Override
    public void onClick(int posetion) {

    }

    public void getDataFromFirebase() {
        //get Data From
    }

    @Override
    public void addSubType(ClassSubType st) {


    }

    @Override
    public void setImageUrl(Uri imageUrl) {
        uri = imageUrl;

    }


}