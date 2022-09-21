package com.dresstips.taqmish.dialogs;

import static android.app.Activity.RESULT_OK;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatDialog;
import androidx.fragment.app.DialogFragment;

import com.dresstips.taqmish.Interfaces.SubTypeDialog;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ClassSubType;
import com.squareup.picasso.Picasso;

public class AddSubItemDialo extends DialogFragment {

    SubTypeDialog ct;
    TextView arabicName;
    TextView englishName ;
    ImageView imageView ;
    Uri uri;

    public AddSubItemDialo(SubTypeDialog ct)
    {
        this.ct = ct;
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {


        View v = getActivity().getLayoutInflater().inflate(R.layout.add_subtype,null);
        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        LayoutInflater inflater = requireActivity().getLayoutInflater();
        builder.setView(v);
        builder.setTitle(R.string.addSubClassDialogTitle);
        builder.setMessage("Please fill all fields to add sub group");
         arabicName = v.findViewById(R.id.arabicName);
         arabicName.setEnabled(false);
         englishName = v.findViewById(R.id.englisName);
         englishName.setEnabled(false);
         imageView =  v.findViewById(R.id.subtypeIcon);
        imageView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                System.out.println("Image view in the dialog clicked");
                intent.setType("image/*");
                startActivityForResult(intent,0);

            }
        });
        builder.setPositiveButton("add", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                if(englishName.getText().toString().isEmpty())
                {
                    englishName.setError("Required Field");
                    return;
                }
                if(arabicName.getText().toString().isEmpty())
                {
                    arabicName.setError("Required Field!");
                    return;
                }
                if(uri == null)
                {
                    Toast.makeText(getContext(),"Click Image to select one, it is required?!!",Toast.LENGTH_LONG).show();
                    return;
                }
                ClassSubType subType = new ClassSubType();

                subType.setArabicName(arabicName.getText().toString());
                subType.setEnglishName(englishName.getText().toString());

                ct.addSubType(subType);

            }
        }).setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {

            }
        });

        return builder.create();
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode == 0 && resultCode == RESULT_OK && data != null)
        {
            ct.setImageUrl(data.getData());
            uri = data.getData();
            englishName.setEnabled(true);
            arabicName.setEnabled(true);
            Picasso.with(getActivity()).load(data.getData()).fit().into(imageView);
        }
    }
}
