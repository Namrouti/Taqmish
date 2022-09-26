package com.dresstips.taqmish.dialogs;

import android.app.AlertDialog;
import android.os.Bundle;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.dresstips.taqmish.R;

public class CoorGroupDialog extends DialogFragment {
    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View v = getActivity().getLayoutInflater().inflate(R.layout.color_group_dialog, null);
        AlertDialog.Builder builder  = new AlertDialog.Builder(getActivity());
    }
}
