package com.dresstips.taqmish.Activities;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Adapters.SimilarImagesAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.models.SimilarImage;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class DisplayImageActivity2 extends AppCompatActivity {
    private ImageView selectedImageView,editedImageView;
    private RecyclerView similarImagesRecyclerView;
    SimilarImagesAdapter adapter;
    private static final String OPENAI_API_KEY = "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";
    private static final String OPENAI_ENDPOINT = "https://api.openai.com/v1/images/variations";
    Uri imageUri;
    private static final int GALLERY_REQUEST_CODE = 1;
    private static final int CAMERA_REQUEST_CODE = 2;
    List<SimilarImage> similarImageList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_display_image);
        similarImageList = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
            requestPermissions(new String[]{Manifest.permission.READ_MEDIA_IMAGES}, 1);
        } else {
            requestPermissions(new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, 1);
        }
        initView();
    }

    private void initView() {
        initImageView();

    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 1) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d("Permission", "Storage permission granted.");
            } else {
                Log.e("Permission", "Storage permission denied.");
            }
        }
    }

    private void openImageChooser() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Choose Image Source");

        String[] options = {"Take Photo", "Choose from Gallery"};
        builder.setItems(options, (dialog, which) -> {
            if (which == 0) {
                openCamera();
            } else if (which == 1) {
                openGallery();
            }
        });

        builder.show();
    }

    private void openCamera() {
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (intent.resolveActivity(this.getPackageManager()) != null) {
            startActivityForResult(intent, CAMERA_REQUEST_CODE);
        }
    }

    private void openGallery() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        intent.setType("image/*");
        startActivityForResult(intent, GALLERY_REQUEST_CODE);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode == Activity.RESULT_OK) {

            if (requestCode == CAMERA_REQUEST_CODE && resultCode == this.RESULT_OK) {
                Bitmap photo = (Bitmap) data.getExtras().get("data");
                selectedImageView.setImageBitmap(photo);
                initRecyclerView();
                uploadImageFromImageView(selectedImageView);
            } else if (requestCode == GALLERY_REQUEST_CODE && data != null) {
                imageUri = data.getData();
                selectedImageView.setImageURI(imageUri);
                initRecyclerView();
                getSimilarImages(imageUri);

            }
        }

    }


    private void initImageView() {
        selectedImageView = findViewById(R.id.selectedImageView);
        editedImageView = findViewById(R.id.editedImageView);
        openImageChooser();
    }

    private void initRecyclerView() {
        similarImagesRecyclerView = findViewById(R.id.similarImagesRecyclerView);
        similarImagesRecyclerView.setLayoutManager(new GridLayoutManager(this, 2));


        adapter = new SimilarImagesAdapter(similarImageList,this, this::onItemSelected);
        similarImagesRecyclerView.setAdapter(adapter);
        // Fetch similar images from OpenAI


        // Initialize RecyclerView Adapter

    }
    private void uploadImageFromImageView(ImageView imageView) {
        // Step 1: Get the Bitmap from ImageView
        imageView.setDrawingCacheEnabled(true);
        imageView.buildDrawingCache();
        Bitmap bitmap = ((BitmapDrawable) imageView.getDrawable()).getBitmap();

        // Step 2: Convert Bitmap to ByteArray
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream);
        byte[] byteArray = stream.toByteArray();

        // Step 3: Upload using OkHttp
        OkHttpClient client = new OkHttpClient();

        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("image", "upload.jpg",
                        RequestBody.create(MediaType.parse("image/jpeg"), byteArray))
                .build();

        Request request = new Request.Builder()
                .url(this.OPENAI_ENDPOINT)  // Replace with your endpoint
                .addHeader("Authorization", "Bearer "+ this.OPENAI_API_KEY)
                .post(requestBody)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e("Upload Error", "Failed: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    Log.d("Upload Success", responseBody);
                    try {
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        JSONArray results = jsonResponse.getJSONArray("data");

                        for (int i = 0; i < results.length(); i++) {
                            JSONObject obj = results.getJSONObject(i);
                            String imageUrl = obj.getString("url");
                            SimilarImage image = new SimilarImage();
                            image.setImageResId(imageUrl);
                            image.setUrl(imageUrl);
                            similarImageList.add(image);
                            runOnUiThread(() -> showSimilarImage(imageUrl));
                        }
                    } catch (JSONException e) {
                        Log.e("JSON Error", e.getMessage());
                    }
                } else {
                    Log.e("Upload Failed", response.code() + ": " + response.message());
                }
            }
        });
    }
    // Example function to get a list of similar images
    private List<SimilarImage> getSimilarImages(Uri uri) {
        List<SimilarImage> images = new ArrayList<>();
     //   String base64Image = convertImageToBase64(imageUri);
        OkHttpClient client = new OkHttpClient();
        ////////////////////////
        String imagePath = getRealPathFromURI(imageUri);
        if (imagePath == null) {
            Log.e("Error", "Invalid image path");

        }

        File file = new File(imagePath);


        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("image", file.getName(),
                        RequestBody.create(file, MediaType.parse("image/*")))
                .build();

        Request request = new Request.Builder()
                .url("https://api.openai.com/v1/vision/similarity")  // Replace with correct endpoint
                .addHeader("Authorization", "Bearer " + this.OPENAI_API_KEY)
                .addHeader("Content-Type", "multipart/form-data")
                .post(requestBody)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e("API Error", e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    Log.d("API Response", responseBody);

                    try {
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        JSONArray results = jsonResponse.getJSONArray("data");

                        for (int i = 0; i < results.length(); i++) {
                            JSONObject obj = results.getJSONObject(i);
                            String imageUrl = obj.getString("url");
                            SimilarImage image = new SimilarImage();
                            image.setImageResId(imageUrl);
                            similarImageList.add(image);
                            runOnUiThread(() -> showSimilarImage(imageUrl));
                        }
                    } catch (JSONException e) {
                        Log.e("JSON Error", e.getMessage());
                    }
                } else {
                    Log.e("API Error", "Response failed: " + response.code());
                }
            }
        });
        return similarImageList;
    }

    private void showSimilarImage(String imageUrl) {
        adapter.notifyDataSetChanged();
        //adapter.updateList(similarImageList);
      //  ImageView imageView = findViewById(R.id.similarImageView);
      //  Picasso.get().load(imageUrl).into(imageView);
    }
    private String convertImageToBase64(Uri imageUri) {
        try {
            Bitmap bitmap = MediaStore.Images.Media.getBitmap(getContentResolver(), imageUri);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, baos);
            byte[] byteArray = baos.toByteArray();
            return Base64.encodeToString(byteArray, Base64.DEFAULT);
        } catch (IOException e) {
            Log.e("Base64 Error", "Error converting image to Base64", e);
            return null;
        }
    }
    // Callback function for item selection
    private void onItemSelected(SimilarImage item) {
        item.setSelected(!item.isSelected()); // Toggle selection state
        adapter.notifyDataSetChanged(); // Refresh RecyclerView
    }
    private String getRealPathFromURI(Uri uri) {
        String[] projection = {MediaStore.Images.Media.DATA};
        Cursor cursor = getContentResolver().query(uri, projection, null, null, null);
        if (cursor != null) {
            int columnIndex = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
            cursor.moveToFirst();
            String path = cursor.getString(columnIndex);
            cursor.close();
            return path;
        }
        return null;
    }
}