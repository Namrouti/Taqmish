package com.dresstips.taqmish.dialogs;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.DialogInterface;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Adapters.ColorAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.ColorGroup;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnSuccessListener;

public class ColorsPickerDialog extends DialogFragment {
    View v, colorView;
    Button saveAll,addColor;
    ImageView colorCircle;
    SeekBar colorAlfa,colorBreigtness;
    TextView colorValue;
    ColorGroup colorGroup;
    Bitmap bitmap;
    int r,g,b,pixel;
    String hex;
    RecyclerView colorRecy;
    ColorAdapter cAdapter;

    public ColorsPickerDialog(ColorGroup colorGroup) {
        this.colorGroup = colorGroup;
    }


    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        v = getActivity().getLayoutInflater().inflate(R.layout.colors_dialog,null);

        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        builder.setTitle("Choose Color Group Colors");
        builder.setView(v);

        saveAll =v.findViewById(R.id.save_all);
        colorCircle = v.findViewById(R.id.color_circle);
        colorAlfa = v.findViewById(R.id.coloralfa);
        colorBreigtness = v.findViewById(R.id.colorbreightness);
        colorValue = v.findViewById(R.id.colorValue);
        addColor = v.findViewById(R.id.addColor);
        colorView = v.findViewById(R.id.colorView);
        colorRecy = v.findViewById(R.id.colorsResycle);

        //color recycler
        cAdapter = new ColorAdapter(getContext(),colorGroup.getColors());
        LinearLayoutManager llm = new LinearLayoutManager(getContext());
        llm.setOrientation(RecyclerView.HORIZONTAL);
        colorRecy.setLayoutManager(llm);
        colorRecy.setAdapter(cAdapter);

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

                     hex = "#" + Integer.toHexString(pixel);
                    colorView.setBackgroundColor(Color.rgb(r,g,b));
                }
                return true;
            }
        });

        addColor.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                colorGroup.getColors().add(hex);
                cAdapter.notifyDataSetChanged();
            }
        });

        saveAll.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                saveColorstoGroup();

            }
        });

        builder.setPositiveButton("Save", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                saveColorstoGroup();
            }
        }).setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
            }
        });


        return builder.create();

    }

    private void saveColorstoGroup() {
        General.getDataBaseRefrenece(ColorGroup.class.getSimpleName()).child(colorGroup.getColorGroupKey()).setValue(colorGroup)
                .addOnSuccessListener(new OnSuccessListener<Void>() {
                    @Override
                    public void onSuccess(Void unused) {
                        Toast.makeText(ColorsPickerDialog.this.getContext(),"All Colors Saved to Group",Toast.LENGTH_LONG).show();

                    }
                });
    }
}
