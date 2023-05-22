package com.dresstips.taqmish.dialogs;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.SeekBar;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.dresstips.taqmish.R;

public class SeekBarDialog extends DialogFragment {

    int minValue, maxValue, defalutValue;
    Context mContext;
    View view;
    String message;
    SeekBar seekBar;
    int prog;
    SeekBarListener listener;

    public SeekBarDialog(Context mContext, int maxValue, int minValue, int defaultValue, String message, SeekBarListener listener) {
        this.mContext = mContext;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.defalutValue = defaultValue;
        this.message = message;
        this.listener = listener;
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        view = getActivity().getLayoutInflater().inflate(R.layout.seekbar_dialog, null);

        seekBar = view.findViewById(R.id.seekBar);

        seekBar.setMax(maxValue);
        seekBar.setMin(minValue);
        seekBar.setProgress(defalutValue);

        seekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int i, boolean b) {
                prog = i;
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {

            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {

            }
        });

        AlertDialog.Builder builder  = new AlertDialog.Builder(mContext);
        builder.setMessage(message);
        builder.setView(view);
        builder.setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {
                listener.onDialogPositiveClick(prog);

            }
        }).setNegativeButton(R.string.cancel, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {

            }
        });
        return builder.create();
    }
}
