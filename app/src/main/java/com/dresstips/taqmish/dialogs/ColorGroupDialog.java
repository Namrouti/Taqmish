package com.dresstips.taqmish.dialogs;

import static android.app.Activity.RESULT_OK;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ColorGroup;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.storage.UploadTask;
import com.squareup.picasso.Picasso;

import java.util.UUID;

public class ColorGroupDialog extends DialogFragment {
    View v;
    Uri imageUri;
    EditText editText;
    ImageView imageView;



    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        v = getActivity().getLayoutInflater().inflate(R.layout.color_group_dialog, null);
        AlertDialog.Builder builder  = new AlertDialog.Builder(getActivity());
        builder.setTitle("Add Color Group");
        builder.setView(v);
        builder.setPositiveButton("Add", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                positiveButtonClickListener(dialog,which);
                if(editText.getText().toString() == null)
                {
                    editText.setError("Please Fill The Color Group Name");
                }
                if(imageUri == null)
                {
                    return;
                }
                String imageKey = UUID.randomUUID().toString() ;
                ColorGroup cg = new ColorGroup();
                cg.setImageName(imageKey + "." + General.getExtention(imageUri,getContext()));
                cg.setGroupName(editText.getText().toString());
                General.getStorageRefrence(ColorGroup.class.getSimpleName()).child(cg.getImageName()).putFile(imageUri).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
                    @Override
                    public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                //        Toast.makeText(ColorGroupDialog.this.getContext(),"Image Uploaded Successfully",Toast.LENGTH_LONG).show();
                        cg.setImageUrl(taskSnapshot.getStorage().getDownloadUrl().toString());
                        cg.setColorGroupKey(General.getDataBaseRefrenece(ColorGroup.class.getSimpleName()).push().getKey());

                        General.getDataBaseRefrenece(ColorGroup.class.getSimpleName()).child(cg.getColorGroupKey()).setValue(cg);
                    }
                });

            }

        }).setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                
            }
        });

        imageView = v.findViewById(R.id.colorGroupIcon);
        editText = v.findViewById(R.id.colorGroupName);
        imageView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                colorGroupIconClicked(v);

            }
        });

        return builder.create();
        
    }

    private void colorGroupIconClicked(View v) {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        System.out.println("Image view in the dialog clicked");
        intent.setType("image/*");
        startActivityForResult(intent,0);
    }
    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode == 0 && resultCode == RESULT_OK && data != null)
        {
            //  ct.setImageUrl(data.getData());
            imageUri = data.getData();
            editText.setEnabled(true);
            Picasso.with(getActivity()).load(data.getData()).fit().into(imageView);
        }
    }

    private void positiveButtonClickListener(DialogInterface dialog, int which) {

    }
}
