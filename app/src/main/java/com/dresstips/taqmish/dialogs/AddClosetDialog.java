package com.dresstips.taqmish.dialogs;

import static android.app.Activity.RESULT_OK;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.Spinner;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Adapters.ColorAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.Closet;
import com.dresstips.taqmish.classes.General;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.storage.UploadTask;
import com.squareup.picasso.Picasso;

import java.util.UUID;

public class AddClosetDialog extends DialogFragment {

    Spinner typespin,mainclass,subclass;
    ImageView image;
    FloatingActionButton browseImage;
    RecyclerView closetColorRecy;
    View colorView;
    Button addColor;


    //to get color from image
    Bitmap bitmap;
    int r,g,b,pixel;
    String hex;
    ColorAdapter cAdapter;
    Closet closet;
    Uri uri;

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {

        closet = new Closet();
        View v = getActivity().getLayoutInflater().inflate(R.layout.add_closet_dialog,null);


        AlertDialog.Builder builder  = new AlertDialog.Builder(getActivity());
        builder.setView(v);
        builder.setPositiveButton("Add", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                if(uri != null) {
                    String imageKey = UUID.randomUUID().toString();
                    closet.setImageKey(imageKey + "." + General.getExtention(uri, getContext()));
                    General.getStorageRefrence(Closet.class.getSimpleName()).child(closet.getImageKey()).putFile(uri).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
                        @Override
                        public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {

                        }
                    });
                }
                else
                {
                    return;
                }

            }
        }).setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {

            }
        });


        mainclass = v.findViewById(R.id.mainClasse);
        subclass = v.findViewById(R.id.subclass);
        typespin = v.findViewById(R.id.typeof);
        image = v.findViewById(R.id.image);
        browseImage = v.findViewById(R.id.browseImage);
        closetColorRecy = v.findViewById(R.id.closetColorRecy);
        colorView = v.findViewById(R.id.colorView);
        addColor = v.findViewById(R.id.addColor);
        typespin = v.findViewById(R.id.typeof);
        mainclass = v.findViewById(R.id.mainClasse);
        subclass = v.findViewById(R.id.subclass);

        cAdapter = new ColorAdapter(getContext(),closet.getColors());
        LinearLayoutManager llm = new LinearLayoutManager(getContext());
        llm.setOrientation(RecyclerView.HORIZONTAL);
        closetColorRecy.setLayoutManager(llm);
        closetColorRecy.setAdapter(cAdapter);
        //initiate spinners

        ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(getContext(),R.array.close_type, android.R.layout.simple_spinner_item);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        typespin.setAdapter(adapter);

        image.setDrawingCacheEnabled(true);
        image.buildDrawingCache(true);
        image.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                if(event.getAction() == MotionEvent.ACTION_DOWN  || event.getAction()== MotionEvent.ACTION_MOVE)
                {
                    bitmap = image.getDrawingCache();
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
                closet.getColors().add(hex);
                cAdapter.notifyDataSetChanged();
            }
        });
        browseImage.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                System.out.println("Image view in the dialog clicked");
                intent.setType("image/*");
                startActivityForResult(intent,0);
            }
        });


        return builder.create();

    }

    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode == 0 && resultCode == RESULT_OK && data != null)
        {
            //  ct.setImageUrl(data.getData());
            uri = data.getData();

            Picasso.with(getActivity()).load(data.getData()).fit().into(image);
        }
    }
}
