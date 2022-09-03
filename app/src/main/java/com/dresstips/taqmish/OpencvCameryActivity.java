package com.dresstips.taqmish;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import androidx.recyclerview.widget.GridLayoutManager;

import androidx.recyclerview.widget.RecyclerView;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import android.media.Image;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;

import android.view.View;
import android.widget.Button;
import android.widget.ImageView;


import com.dresstips.taqmish.Adapters.DetectedObjectRecycler;

import com.google.android.gms.tasks.OnSuccessListener;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.objects.DetectedObject;
import com.google.mlkit.vision.objects.ObjectDetection;
import com.google.mlkit.vision.objects.ObjectDetector;
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions;




import java.io.FileNotFoundException;
import java.io.IOException;

import java.util.List;


import at.markushi.ui.CircleButton;


public class OpencvCameryActivity extends AppCompatActivity {
    ObjectDetectorOptions option = new ObjectDetectorOptions.Builder()
            .enableMultipleObjects()
            .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
            .enableClassification()
            .build();

    ObjectDetector detector = ObjectDetection.getClient(option);
    ImageView imageView;
    CircleButton capture;
    CircleButton brows;
    RecyclerView recyclerView;
    Button toEdge;
    ImageView imageView2;
    Bitmap bitmap;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_opencv_camery);


    }

    private void toEdge(View v) {

        Intent sceneViewerIntent = new Intent(Intent.ACTION_VIEW);
        sceneViewerIntent.setData(Uri.parse("https://arvr.google.com/scene-viewer/1.0?file=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF/Avocado.gltf"));
        sceneViewerIntent.setPackage("com.google.android.googlequicksearchbox");
        startActivity(sceneViewerIntent);

    }

    static final int REQUEST_IMAGE_CAPTURE = 1;
    static final int BRWOSE_GALLRY_PHOTO =2;

    private void dispatchTakePictureIntent() {
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        try {
            startActivityForResult(takePictureIntent, REQUEST_IMAGE_CAPTURE);
        } catch (ActivityNotFoundException e) {
            // display error state to the user
        }
    }
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == RESULT_OK) {
            Bundle extras = data.getExtras();
            Bitmap imageBitmap = (Bitmap) extras.get("data");
            bitmap = imageBitmap;
            imageView.setImageBitmap(imageBitmap);
            imageProcess(InputImage.fromBitmap(imageBitmap,0));

        } else if (requestCode == BRWOSE_GALLRY_PHOTO) {
            Uri targetUri = data.getData();

            Bitmap bitmap;
            try {
                bitmap = BitmapFactory.decodeStream(getContentResolver().openInputStream(targetUri));
                imageProcess(InputImage.fromFilePath(OpencvCameryActivity.this,targetUri));
                imageView.setImageBitmap(bitmap);
            } catch (FileNotFoundException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
            catch(IOException e)
            {

            }

        }
    }

    public void imageProcess(InputImage imge)
    {

        detector.process(imge).addOnSuccessListener(new OnSuccessListener<List<DetectedObject>>() {
            @Override
            public void onSuccess(List<DetectedObject> detectedObjects) {



                DetectedObjectRecycler adapter = new DetectedObjectRecycler(detectedObjects, imge.getBitmapInternal());
                recyclerView.setAdapter(adapter);
            }
        });
    }




}