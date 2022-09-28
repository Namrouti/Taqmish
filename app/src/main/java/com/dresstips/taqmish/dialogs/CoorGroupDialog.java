package com.dresstips.taqmish.dialogs;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.DialogInterface;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;

import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.dresstips.taqmish.R;

public class CoorGroupDialog extends DialogFragment {
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
            }
        }).setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                
            }
        });

        editText = v.findViewById(R.id.color)

        return builder.create();
        
    }

    private void positiveButtonClickListener(DialogInterface dialog, int which) {

    }
}
