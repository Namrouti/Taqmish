package com.dresstips.taqmish.Activities;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.MimeTypeMap;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.dresstips.taqmish.Adapters.ClassTypeAdatpter;

import com.dresstips.taqmish.Adapters.TypeLevel;
import com.dresstips.taqmish.Interfaces.ClassTyprRecyclerViewInterface;
import com.dresstips.taqmish.classes.ClassSubType;
import com.dresstips.taqmish.classes.ClassType;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.UUID;

public class ManageClasses extends AppCompatActivity  implements ClassTyprRecyclerViewInterface {
    FloatingActionButton addbtn;
    ArrayList<ClassType> types = new ArrayList<>();
    EditText arabicName, englishName;
    ImageView image;
    Dialog dialog;
    TextView title,counter;

    FirebaseDatabase dataBaseInst;
    FirebaseStorage storageInst;
    RecyclerView recy;
    Uri targetUri;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_manage_classes);
        title = findViewById(R.id.title);
        counter = findViewById(R.id.counter);
        recy = (RecyclerView) findViewById(R.id.classRecyclerView);
        ClassTypeAdatpter adapter = new ClassTypeAdatpter(types,this,this,TypeLevel.MAIN);
        recy.setAdapter(adapter);
        recy.setLayoutManager(new LinearLayoutManager(this));
        title.setText(R.string.MainClass);
        addbtn = (FloatingActionButton) findViewById(R.id.addbtn);
        addbtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showAddClassDialog();
            }
        });

        General.getDataBaseRefrenece(ClassType.class.getSimpleName()).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                for(DataSnapshot d : snapshot.getChildren())
                {
                    ClassType ct  = d.getValue(ClassType.class);
                    types.add(ct);
                    adapter.notifyDataSetChanged();
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });

    }



    static final int BRWOSE_GALLRY_PHOTO =2;
    private void addClassDialogImageViewClicked(View v) {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("image/*");
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
        MimeTypeMap mim = MimeTypeMap.getSingleton();
        String exten = mim.getExtensionFromMimeType(getContentResolver().getType(targetUri));

        StorageReference storageRef = FirebaseStorage.getInstance().getReference("MainClass/images").child(imageId + "." + exten);
        storageRef.putFile(targetUri)
                .addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
                    @Override
                    public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {

                        ClassType mainClass = new ClassType();
                        mainClass.setArabicName(arabicName.getText().toString());
                        mainClass.setEnglishName(englishName.getText().toString());
                        mainClass.setImageUrl(taskSnapshot.getStorage().getDownloadUrl().toString());

                        DatabaseReference ref = dataBaseInst.getReference("MainClass");
                       String keyref = ref.push().getKey();
                       mainClass.setUuid(keyref);
                       mainClass.setImageName(imageId + "." + exten);
                       ref.child(keyref).setValue(mainClass);
                       types.add(mainClass);



                    }
                }).addOnFailureListener(new OnFailureListener() {
            @Override
            public void onFailure(@NonNull Exception e) {

            }
        });



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
                    Picasso.with(this).load(targetUri).fit().into(image);
                }

                break;
        }
    }


    @Override
    public void onClick(int posetion) {
        Intent intent = new Intent(this,SubType.class);
        intent.putExtra("arabicName",types.get(posetion).getArabicName());
        intent.putExtra("englishName",types.get(posetion).getEnglishName());
        intent.putExtra("imageKey", types.get(posetion).getImageName());
        intent.putExtra("imageUrl",types.get(posetion).getImageUrl());
        intent.putExtra("imageName",types.get(posetion).getImageName());
        intent.putExtra("rootKey",types.get(posetion).getUuid());
        startActivity(intent);


    }
    public void showAddClassDialog()
    {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        View view = LayoutInflater.from(this).inflate(R.layout.dialog_addclass,null);
        EditText arabicName = view.findViewById(R.id.arabicName);
        EditText englishName = view.findViewById(R.id.englishName);
        ImageView classImage = view.findViewById(R.id.classImage);
        classImage.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                classImageClicked(v);
            }
        });

        builder.setPositiveButton("Save", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                String classKey = General.getDataBaseRefrenece(ClassType.class.getSimpleName()).push().getKey();
                ClassType calssToAdd = new ClassType();
                if(englishName.getText().toString().isEmpty())
                {
                    englishName.setError("Please add english Name");
                    return;
                }
                if (arabicName.getText().toString().isEmpty())
                {
                    arabicName.setError("Insert Arabic Name");
                    return;
                }
                calssToAdd.setArabicName(arabicName.getText().toString());
                calssToAdd.setEnglishName(englishName.getText().toString());
                calssToAdd.setUuid(classKey);
                StorageReference sRef = General.getStorageRefrence(ClassType.class.getSimpleName());
                if(targetUri != null)
                {
                    sRef.putFile(targetUri).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
                        @Override
                        public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                            sRef.getDownloadUrl().addOnSuccessListener(new OnSuccessListener<Uri>() {
                                @Override
                                public void onSuccess(Uri uri) {
                                    calssToAdd.setImageUrl(uri.toString());
                                    General.getDataBaseRefrenece(ClassType.class.getSimpleName()).child(calssToAdd.getUuid()).setValue(calssToAdd);


                                }
                            });

                        }
                    });
                }
                else
                {
                    Toast.makeText(ManageClasses.this,"Please select Icon for the class",Toast.LENGTH_LONG).show();
                }

            }
        }).setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {

            }
        });

        builder.setView(view);
        builder.create().show();;
    }

    private void classImageClicked(View v) {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("image/*");
        startActivityForResult(intent, BRWOSE_GALLRY_PHOTO);
        image = (ImageView) v;
    }
}
