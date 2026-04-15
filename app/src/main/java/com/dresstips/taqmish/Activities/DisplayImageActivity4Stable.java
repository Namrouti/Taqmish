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
import android.util.Log;
import android.widget.ImageView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Adapters.SimilarImagesAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.models.SimilarImage;
import com.squareup.picasso.Picasso;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class DisplayImageActivity4Stable extends AppCompatActivity {
    private ImageView selectedImageView,editedImageView;
    File imageFile;
    private RecyclerView similarImagesRecyclerView;
    SimilarImagesAdapter adapter;
    private static final String OPENAI_API_KEY = "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";
    private static final String OPENAI_ENDPOINT = "https://api.openai.com/v1/images/variations";
    Uri imageUri;
    private static final int GALLERY_REQUEST_CODE = 1;
    private static final int CAMERA_REQUEST_CODE = 2;
    String mediaType = "image/jpeg"; // Default to PNG
    List<SimilarImage> similarImageList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_display_image);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, 100);
            } else {
                initView();
            }
        } else {
            initView();
        }


    }

    private void initView() {

        initImageView();
        //  initRecyclerView();
        openImageChooser();






    }
    private File saveBitmapToFile(Bitmap bitmap, String filename) throws IOException {
        File file = new File(getFilesDir(), filename);
        FileOutputStream out = new FileOutputStream(file);
        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, out);
        out.flush();
        out.close();
        return file;
    }
    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode == Activity.RESULT_OK) {

            if (requestCode == CAMERA_REQUEST_CODE && resultCode == this.RESULT_OK) {
                Bitmap photo = (Bitmap) data.getExtras().get("data");
                selectedImageView.setImageBitmap(photo);
                uploadImageFromImageView(selectedImageView);
                //          editImageWithPrompt();

            } else if (requestCode == GALLERY_REQUEST_CODE && data != null) {
                imageUri = data.getData();
                selectedImageView.setImageURI(imageUri);
                // Determine MIME type from the URI of the selected image
                String mimeType = getContentResolver().getType(imageUri);
                Log.d("Image MIME Type", "MIME type: " + mimeType);

                if (mimeType != null) {

                    // Determine the media type based on the MIME type
                    if (mimeType.equals("image/jpeg")) {
                        mediaType = "image/jpeg";
                    } else if (mimeType.equals("image/png")) {
                        mediaType = "image/png";
                    }

                    imageFile = new File(getRealPathFromURI(imageUri));
                  //  editImageWithPrompt();
                    uploadImageFromImageView(selectedImageView);


                }


            }
//sk-d0d73807a8d14cbdbe3294d23dc164fc
        }

    }
    private void editImageWithPrompt() {
        Bitmap bitmap = ((BitmapDrawable) selectedImageView.getDrawable()).getBitmap();



        OkHttpClient client = new OkHttpClient();


        MultipartBody.Builder builder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("prompt", "Make the background a beach")
                .addFormDataPart("image", imageFile.getName(),
                        RequestBody.create(imageFile, MediaType.parse(mediaType)))  // Ensure it's correct type like image/png or image/jpeg
                .addFormDataPart("size", "1024x1024")
                .addFormDataPart("n", "1");

        RequestBody requestBody = builder.build();

        Request request = new Request.Builder()
                .url(OPENAI_ENDPOINT)
                .addHeader("Authorization", "Bearer " + OPENAI_API_KEY)
                .post(requestBody)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e("OpenAI", "API call failed: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful() && response.body() != null) {
                    try {
                        String responseString = response.body().string();
                        JSONObject responseJson = new JSONObject(responseString);
                        String imageUrl = responseJson.getJSONArray("data")
                                .getJSONObject(0).getString("url");

                        runOnUiThread(() -> Picasso.with(DisplayImageActivity4Stable.this).load(imageUrl).fit().into(editedImageView));
                    } catch (Exception e) {
                        Log.e("OpenAI", "Parsing failed: " + e.getMessage());
                    }
                } else {
                    Log.e("OpenAI", "API error: " + response.code() + " - " + response.message());
                }
            }
        });




    }

    private void uploadImageFromImageView(ImageView imageView) {
        Bitmap bitmap = ((BitmapDrawable) imageView.getDrawable()).getBitmap();

        // Resize to 512x512 (required for OpenAI image APIs)
        Bitmap resizedBitmap = Bitmap.createScaledBitmap(bitmap, 512, 512, true);

        // Convert to PNG
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        resizedBitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
        byte[] byteArray = stream.toByteArray();

        OkHttpClient client = new OkHttpClient();

        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("image", "upload.png",
                        RequestBody.create(MediaType.parse("image/png"), byteArray))
                .addFormDataPart("n", "1")
                .addFormDataPart("size", "512x512")
                .build();

        Request request = new Request.Builder()
                .url("https://api.openai.com/v1/images/variations")
                .addHeader("Authorization", "Bearer " + OPENAI_API_KEY)
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
                    try {
                        String responseString = response.body().string();
                        JSONObject responseJson = new JSONObject(responseString);
                        String imageUrl = responseJson.getJSONArray("data")
                                .getJSONObject(0).getString("url");

                        runOnUiThread(() ->
                                Picasso.with(DisplayImageActivity4Stable.this)
                                        .load(imageUrl)
                                        .fit()
                                        .into(editedImageView));
                    } catch (Exception e) {
                        Log.e("OpenAI", "Parsing failed: " + e.getMessage());
                    }
                } else {
                    Log.e("OpenAI", "API error: " + response.code() + " - " + response.message());
                    Log.e("OpenAI", "Body: " + response.body().string()); // helpful for debugging
                }
            }
        });
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


    private File saveInputStreamToFile(InputStream inputStream, String filename) throws IOException {
        File file = new File(getFilesDir(), filename);
        try (OutputStream outputStream = new FileOutputStream(file)) {
            byte[] buffer = new byte[1024];
            int length;
            while ((length = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, length);
            }
        } finally {
            inputStream.close();
        }
        return file;
    }
    public String getRealPathFromURI(Uri contentUri) {
        String[] proj = {MediaStore.Images.Media.DATA};
        Cursor cursor = getContentResolver().query(contentUri, proj, null, null, null);
        if (cursor != null) {
            cursor.moveToFirst();
            int columnIndex = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
            String filePath = cursor.getString(columnIndex);
            cursor.close();
            return filePath;
        } else {
            return null;
        }
    }


    private void initImageView() {
        selectedImageView = findViewById(R.id.selectedImageView);
        editedImageView = findViewById(R.id.editedImageView);

    }

    private void initRecyclerView() {
        similarImagesRecyclerView = findViewById(R.id.similarImagesRecyclerView);
        similarImagesRecyclerView.setLayoutManager(new GridLayoutManager(this, 2));


        adapter = new SimilarImagesAdapter(similarImageList,this, this::onItemSelected);
        similarImagesRecyclerView.setAdapter(adapter);
        // Fetch similar images from OpenAI


        // Initialize RecyclerView Adapter

    }
    private void onItemSelected(SimilarImage item) {
        item.setSelected(!item.isSelected()); // Toggle selection state
        adapter.notifyDataSetChanged(); // Refresh RecyclerView
    }

}