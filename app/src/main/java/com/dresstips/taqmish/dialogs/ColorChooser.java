package com.dresstips.taqmish.dialogs;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.DialogInterface;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;
import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.dresstips.taqmish.Interfaces.ColorChooserHFragmentInterface;
import com.dresstips.taqmish.R;

public class ColorChooser extends DialogFragment {

    View view,colorView;
    Bitmap bitmap;
    ImageView colorCircle;
    int r,g,b,pixel;
    String hex;

    ColorChooserHFragmentInterface mInterface;

    public ColorChooser(ColorChooserHFragmentInterface mInterface)
    {
        this.mInterface = mInterface;
    }
    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        view = getActivity().getLayoutInflater().inflate(R.layout.color_chooser,null);
        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        builder.setTitle("Choose Color Group Colors");
        builder.setView(view);

        colorView = view.findViewById(R.id.colorView);

        colorCircle = view.findViewById(R.id.color_circle);
        colorCircle.setDrawingCacheEnabled(true);
        colorCircle.buildDrawingCache(true);

        colorCircle.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                if(event.getAction() == MotionEvent.ACTION_DOWN  || event.getAction()== MotionEvent.ACTION_MOVE)
                {
                    bitmap = colorCircle.getDrawingCache();
                    pixel = bitmap.getPixel((int) event.getX(),(int) event.getY());

                    r = Color.red(pixel);
                    g = Color.green(pixel);
                    b = Color.blue(pixel);

                    hex =  String.format("#%02x%02x%02x", r, g, b);
                    colorView.setBackgroundColor(Color.rgb(r,g,b));
                }
                return true;
            }
        });
        builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                mInterface.getColor(hex);
            }
        }).setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {

            }
        });
        return  builder.create();
    }
}
