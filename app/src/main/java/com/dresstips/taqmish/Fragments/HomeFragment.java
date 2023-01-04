package com.dresstips.taqmish.Fragments;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.Camera;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.dresstips.taqmish.R;


public class HomeFragment extends Fragment {
    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home,container,false);
        Button captur = view.findViewById(R.id.button_capture);
        captur.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CaptureImage(v);
            }
        });

        return view;
    }

    private void CaptureImage(View v) {
        Camera camera = Camera.open();
        camera.takePicture(null, null, new Camera.PictureCallback() {
            @Override
            public void onPictureTaken(byte[] data, Camera camera) {
                // Convert the captured photo to a Bitmap object
                Bitmap bitmap = BitmapFactory.decodeByteArray(data, 0, data.length);

                // Use OpenCV to detect and locate the object in the image

            }
        });
    }


}
