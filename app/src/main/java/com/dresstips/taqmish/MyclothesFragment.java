package com.dresstips.taqmish;

import static android.app.Activity.RESULT_OK;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContract;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityOptionsCompat;
import androidx.fragment.app.Fragment;

import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;

import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.objects.DetectedObject;
import com.google.mlkit.vision.objects.ObjectDetection;
import com.google.mlkit.vision.objects.ObjectDetector;
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions;

import java.util.List;

import at.markushi.ui.CircleButton;


public class MyclothesFragment extends Fragment {

    CircleButton capture ;
    ActivityResultLauncher luncher;
    ImageView imageView;
    Button opencvbtn;


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_myclothes, container, false);



    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);


    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        luncher = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), new ActivityResultCallback<ActivityResult>() {
            @Override
            public void onActivityResult(ActivityResult result) {

                if (result.getResultCode()  == RESULT_OK && result.getData() != null) {
                    Bundle extras = result.getData().getExtras();
                    Bitmap imageBitmap = (Bitmap) extras.get("data");
                    imageView.setImageBitmap(imageBitmap);
                    ObjectDetectorOptions options =
                            new ObjectDetectorOptions.Builder()
                                    .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
                                    .enableMultipleObjects()
                                    .enableClassification()  // Optional
                                    .build();
                    ObjectDetector objectDetector = ObjectDetection.getClient(options);
                    InputImage image = InputImage.fromBitmap(imageBitmap,90);
                    objectDetector.process(image)
                            .addOnSuccessListener(
                                    new OnSuccessListener<List<DetectedObject>>() {
                                        @Override
                                        public void onSuccess(List<DetectedObject> detectedObjects) {
                                            // Task completed successfully
                                            // ...
                                        }
                                    })
                            .addOnFailureListener(
                                    new OnFailureListener() {
                                        @Override
                                        public void onFailure(@NonNull Exception e) {
                                            // Task failed with an exception
                                            // ...
                                        }
                                    });
                }

            }
        });
        capture = (CircleButton) getActivity().findViewById(R.id.capturebtn);
        opencvbtn = (Button) getActivity().findViewById(R.id.opencvCamerabtn);
        opencvbtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(MyclothesFragment.this.getActivity(),OpencvCameryActivity.class);
                MyclothesFragment.this.getActivity().startActivity(intent);
            }
        });
        imageView = (ImageView) getActivity().findViewById(R.id.imageView);
        capture.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                dispatchTakePictureIntent();

            }
        });
    }

    static final int REQUEST_IMAGE_CAPTURE = 1;

    private void dispatchTakePictureIntent() {
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        try {
           luncher.launch(takePictureIntent);
        } catch (ActivityNotFoundException e) {
            // display error state to the user
        }
    }
}