package com.dresstips.taqmish;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
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


import org.opencv.android.OpenCVLoader;
import org.opencv.android.Utils;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.imgproc.Imgproc;

import java.io.FileNotFoundException;
import java.io.IOException;

import java.util.List;


import at.markushi.ui.CircleButton;


public class OpencvCameryActivity extends AppCompatActivity implements ImageAnalysis.Analyzer{
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
        OpenCVLoader.initDebug();


        imageView2 = (ImageView) findViewById(R.id.imageView2);
        toEdge  = (Button) findViewById(R.id.button2); 
        imageView = (ImageView) findViewById(R.id.imageView);
        capture = (CircleButton) findViewById(R.id.capture);
        brows = (CircleButton) findViewById(R.id.browsbtn);
        recyclerView = (RecyclerView) findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new GridLayoutManager(this,2));
        brows.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(Intent.ACTION_PICK, android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
                   startActivityForResult(intent, BRWOSE_GALLRY_PHOTO);

            }
        });
        capture.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dispatchTakePictureIntent();
            }
        });
        toEdge.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                toEdge(v);
            }
        });
        

    }

    private void toEdge(View v) {

        Intent sceneViewerIntent = new Intent(Intent.ACTION_VIEW);
        sceneViewerIntent.setData(Uri.parse("https://arvr.google.com/scene-viewer/1.0?file=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF/Avocado.gltf"));
        sceneViewerIntent.setPackage("com.google.android.googlequicksearchbox");
        startActivity(sceneViewerIntent);

/*        Mat rgba = new Mat();
        Utils.bitmapToMat(bitmap,rgba);
        Mat edges = new Mat(rgba.size(), CvType.CV_8UC1);
        Imgproc.cvtColor(rgba, edges, Imgproc.COLOR_RGB2GRAY, 4);
        Imgproc.Canny(edges, edges, 80, 100);

        // Don't do that at home or work it's for visualization purpose.
   //     BitmapHelper.showBitmap(this, bitmap, imageView);
        Bitmap resultBitmap = Bitmap.createBitmap(edges.cols(), edges.rows(), Bitmap.Config.ARGB_8888);
        Utils.matToBitmap(edges, resultBitmap);
     //   BitmapHelper.showBitmap(this, resultBitmap, detectEdgesImageView);
        imageView2.setImageBitmap(resultBitmap);*/
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


    @Override
    public void analyze(ImageProxy imageProxy) {

        @SuppressLint("UnsafeOptInUsageError") Image mediaImage = imageProxy.getImage();
        if (mediaImage != null) {
            InputImage image =
                    InputImage.fromMediaImage(mediaImage, imageProxy.getImageInfo().getRotationDegrees());
            imageProcess(image);
            // Pass image to an ML Kit Vision API
            // ...
        }
    }
}