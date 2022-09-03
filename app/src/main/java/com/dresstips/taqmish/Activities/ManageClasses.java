package com.dresstips.taqmish.Activities;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.FragmentManager;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Toast;

import com.bumptech.glide.Glide;
import com.bumptech.glide.Registry;
import com.bumptech.glide.annotation.GlideModule;
import com.bumptech.glide.module.AppGlideModule;
import com.dresstips.taqmish.Adapters.ClassTypeAdatpter;
import com.dresstips.taqmish.ClassType;
import com.dresstips.taqmish.OpencvCameryActivity;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.dialogs.AddClassType;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;
import com.google.mlkit.vision.common.InputImage;
import com.squareup.picasso.Picasso;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.UUID;

public class ManageClasses extends AppCompatActivity {
    FloatingActionButton addbtn;
    ArrayList<ClassType> types = new ArrayList<>();
    EditText arabicName, englishName;
    ImageView image;
    Dialog dialog;
    Bitmap bitmap;
    static Context context;
    FirebaseDatabase dataBaseInst;
    FirebaseStorage storageInst;
    RecyclerView recy;
    Uri targetUri;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_manage_classes);
        dialog = new Dialog(ManageClasses.this);
        dialog.setContentView(R.layout.dialog_addclass);
        dialog.getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT,ViewGroup.LayoutParams.WRAP_CONTENT);
        englishName = (EditText) dialog.findViewById(R.id.englishName);
        arabicName = (EditText) dialog.findViewById(R.id.arabicName);
        image = (ImageView) dialog.findViewById(R.id.classImage);
        context = this.getApplicationContext();
        recy = (RecyclerView) findViewById(R.id.classRecyclerView);
        dataBaseInst = FirebaseDatabase.getInstance();
        storageInst = FirebaseStorage.getInstance();
        dataBaseInst.getReference().child("MainClass").get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                for(DataSnapshot d:dataSnapshot.getChildren())
                {
                    ClassType ct = d.getValue(ClassType.class);
                    types.add(ct) ;
                }
                ClassTypeAdatpter adapter = new ClassTypeAdatpter(types , ManageClasses.this);
                recy.setLayoutManager(new LinearLayoutManager(ManageClasses.this));
                recy.setAdapter(adapter);
                recy.addItemDecoration(new DividerItemDecoration(ManageClasses.this,DividerItemDecoration.VERTICAL));
            }
        });



        addbtn = (FloatingActionButton) findViewById(R.id.addbtn);
        addbtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                addClass(v);
            }
        });

    }

    public static Context getContext()
    {
        return context;
    }

    private void addClass(View v) {


        Button add,cancel;
        cancel = (Button) dialog.findViewById(R.id.cancelbtn);
        add = (Button) dialog.findViewById(R.id.addClassbtn);
        cancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                addClassDialogCancelButtonClicked(v);
            }
        });
        add.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                addClassDialogAddButtonClicked(v);
            }
        });
        image.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                addClassDialogImageViewClicked(v);
            }
        });
        
        dialog.show();


    }
    static final int BRWOSE_GALLRY_PHOTO =2;
    private void addClassDialogImageViewClicked(View v) {
        Intent intent = new Intent(Intent.ACTION_PICK, android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        startActivityForResult(intent, BRWOSE_GALLRY_PHOTO);
    }

    private void addClassDialogAddButtonClicked(View v) {
        if(arabicName.getText().toString().isEmpty())
        {
            arabicName.setError("Arabic Name Required?!!");
            return;
        }
        if(englishName.getText().toString().isEmpty())
        {
            englishName.setError("English Name is Required?!!");
            return;
        }
        if(targetUri == null)
        {
            Toast.makeText(this,"Please Press on Image Icon to Browse an Image",Toast.LENGTH_LONG).show();
            return;
        }
        String imageId = UUID.randomUUID().toString();
        StorageReference storageRef = FirebaseStorage.getInstance().getReference(R.string.class_type_imges_url +imageId);
        storageRef.putFile(targetUri)
                .addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
                    @Override
                    public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {

                        ClassType mainClass = new ClassType();
                        mainClass.setArabicName(arabicName.getText().toString());
                        mainClass.setEnglishName(englishName.getText().toString());
                        mainClass.setImageUrl(taskSnapshot.getUploadSessionUri().toString());
                        DatabaseReference ref = dataBaseInst.getReference("MainClass");
                       String keyref = ref.push().getKey();
                       ref.child(keyref).setValue(mainClass);


                    }
                }).addOnFailureListener(new OnFailureListener() {
            @Override
            public void onFailure(@NonNull Exception e) {

            }
        });

    /*    storageRef.putBytes(byteArray).addOnCompleteListener(new OnCompleteListener<UploadTask.TaskSnapshot>() {
            @Override
            public void onComplete(@NonNull Task<UploadTask.TaskSnapshot> task) {
                if(task.isSuccessful())
                {

                    ClassType mainClass = new ClassType();
                    mainClass.setArabicName(arabicName.getText().toString());
                    mainClass.setEnglishName(englishName.getText().toString());
                    mainClass.setImageUrl(storageRef.getDownloadUrl().toString());
                    DatabaseReference ref = dataBaseInst.getReference("MainClass");
                    UUID uuid = UUID.randomUUID();
                    mainClass.setUuid(uuid.toString());
                    ref.child(uuid.toString()).setValue(mainClass);

                   Toast.makeText(ManageClasses.this,"Saved Successfully",Toast.LENGTH_LONG).show();
                }

            }
        });*/




    }

    private void addClassDialogCancelButtonClicked(View v) {
        dialog.cancel();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode){
            case BRWOSE_GALLRY_PHOTO:
                if(resultCode == RESULT_OK && data != null && data.getData() != null)
                {
                    targetUri = data.getData();
                    Picasso.with(this).load(targetUri).into(image);
                }

                break;
        }
    }


}
