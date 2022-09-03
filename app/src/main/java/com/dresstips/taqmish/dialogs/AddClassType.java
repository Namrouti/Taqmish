package com.dresstips.taqmish.dialogs;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;

import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.dresstips.taqmish.R;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.storage.FirebaseStorage;

public class AddClassType extends DialogFragment {

    EditText arabicName,englishName;
    ImageView image;
    FirebaseDatabase database;
    FirebaseStorage storage;
    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
         AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        // Get the layout inflater
        LayoutInflater inflater = requireActivity().getLayoutInflater();


        // Inflate and set the layout for the dialog
        // Pass null as the parent view because its going in the dialog layout
        builder.setView(inflater.inflate(R.layout.dialog_addclass, null))
                // Add action buttons
                .setPositiveButton(R.string.addClass, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int id) {

                    }
                })
                .setNegativeButton(R.string.cancel, new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        AddClassType.this.getDialog().cancel();
                    }
                });
        arabicName = (EditText) this.getView().findViewById(R.id.arabicName);
        image = (ImageView) this.getView().findViewById(R.id.classImage);
        
        image.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                browsImage();
            }
        });

        return builder.create();
    }
    static final int BROWS_IMAGE =2;
    private void browsImage() {
        Intent intent = new Intent(Intent.ACTION_PICK,
                android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI);

    }

    public  void addItem()
    {

    }
}
