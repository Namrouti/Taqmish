package com.dresstips.taqmish.Activities;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.widget.ImageView;
import androidx.appcompat.app.AppCompatActivity;
import com.dresstips.taqmish.R;
import com.squareup.picasso.Picasso;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;

import okhttp3.*;

public class DisplayImageActivity extends AppCompatActivity {
    private static final String DEEPSEEK_API_KEY = "d0d73807a8d14cbdbe3294d23dc164fc";
    private static final String DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/images/generate";
    private static final String STABLE_DIFFUSION_API = "https://stablediffusionapi.com/api/v5/removebg_mask";
    private static final String API_KEY = "6rAzM5jFgNzANwY5vAhGOkoP7o1paZbKojPrswYA5y4cgmutDuKWNUjXjqoX";
    //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
    private static final String OPENAI_API_KEY = "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";
    private static final String OPENAI_ENDPOINT = "https://api.openai.com/v1/images/variations";
    private static final int GALLERY_REQUEST_CODE = 1;
    private static final int CAMERA_REQUEST_CODE = 2;

    private ImageView selectedImageView, editedImageView;
    Uri imageUri;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_display_image);
        initViews();
        openImageChooser();
    }

    private void initViews() {
        selectedImageView = findViewById(R.id.selectedImageView);
        editedImageView = findViewById(R.id.editedImageView);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode == Activity.RESULT_OK) {
            if (requestCode == CAMERA_REQUEST_CODE) {
                Bitmap photo = (Bitmap) data.getExtras().get("data");
                selectedImageView.setImageBitmap(photo);
                generateImageVariations();
            } else if (requestCode == GALLERY_REQUEST_CODE && data != null) {
                imageUri = data.getData();
                selectedImageView.setImageURI(data.getData());
                generateImageVariations();
            }
        }
    }
    private void generateImageVariations() {

            // 1. Prepare the image
            Bitmap bitmap = ((BitmapDrawable) selectedImageView.getDrawable()).getBitmap();
            Bitmap resizedBitmap = Bitmap.createScaledBitmap(bitmap, 512, 512, true);

            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            resizedBitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
            String base64Image = "data:image/png;base64," +
                    Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);

            OkHttpClient client = new OkHttpClient().newBuilder().build();
            String json = "{\n" +
                    "  \"key\":\"" + OPENAI_API_KEY + "\",\n" +
                    "  \"seed\":12345,\n" +
                    "  \"image\":\"" + imageUri + "\",\n" +
                    "  \"post_process_mask\": false,\n" +
                    "  \"only_mask\": false,\n" +
                    "  \"alpha_matting\": false,\n" +
                    "  \"webhook\": null,\n" +
                    "  \"track_id\": null\n" +
                    "}";

            MediaType mediaType = MediaType.parse("application/json");
            RequestBody body = RequestBody.create(mediaType, json);

            Request request = new Request.Builder()
                    .url(DEEPSEEK_ENDPOINT) // Or the endpoint you want
                    .method("POST", body)
                    .addHeader("Content-Type", "application/json")
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e("API_ERROR", "Request failed: " + e.getMessage());
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {

                    String responseBody = response.body().string();
                    Log.d("API_RESPONSE", responseBody);
                    // Handle your image response or error here
                    try {
                        JSONObject json = new JSONObject(responseBody);

                        String status = json.optString("status", "");

                        if (status.equalsIgnoreCase("success")) {
                            JSONArray output = json.optJSONArray("output");
                            if (output != null && output.length() > 0) {
                                String imageUrl = output.getString(0);
                                showImage(imageUrl);
                            }
                        } else if (status.equalsIgnoreCase("processing")) {
                            String fetchUrl = json.optString("fetch_result", "");
                            int eta = json.optInt("eta", 20); // Estimated wait in seconds

                            Log.d("API_WAIT", "Image processing. Waiting " + eta + " seconds...");

                            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                                Log.e("API_ERROR", "fetchUrl: " + fetchUrl);
                                fetchImageResult(fetchUrl,body);
                            }, eta * 1000L);
                        } else {
                            String errorMessage = json.optString("messege", "Unknown error");
                            Log.e("API_ERROR", "Error: " + errorMessage);
                        }

                    } catch (JSONException e) {
                        Log.e("API_ERROR", "Failed to parse response: " + e.getMessage());
                    }
                }
            });


    }
    private void fetchImageResult(String fetchUrl, RequestBody body) {


        Request request = new Request.Builder()
                .url(fetchUrl)
                .post(body)
                .build();

        new OkHttpClient().newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e("API_ERROR", "Fetch failed: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseBody = response.body().string();
                Log.d("FETCH_RESPONSE", responseBody);

                try {
                    JSONObject json = new JSONObject(responseBody);
                    if (json.optString("status", "").equalsIgnoreCase("success")) {
                        JSONArray output = json.optJSONArray("output");
                        if (output != null && output.length() > 0) {
                            String imageUrl = output.getString(0);
                            showImage(imageUrl);
                        }
                    } else {
                        String message = json.optString("messege", "Still processing or failed");
                        Log.e("API_ERROR", message);
                    }
                } catch (JSONException e) {
                    Log.e("API_ERROR", "Fetch parse failed: " + e.getMessage());
                }
            }
        });
    }
    private void showImage(String imageUrl) {
        runOnUiThread(() -> {
            Picasso.with(DisplayImageActivity.this)
                    .load(imageUrl)
                    .fit()
                    .centerInside()
                    .into(editedImageView);
        });
    }


   /* private void generateImageVariations() {
        Bitmap bitmap = ((BitmapDrawable) selectedImageView.getDrawable()).getBitmap();
        Bitmap resizedBitmap = Bitmap.createScaledBitmap(bitmap, 512, 512, true);

        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        resizedBitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
        byte[] byteArray = stream.toByteArray();

        OkHttpClient client = new OkHttpClient();
        RequestBody body = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("image", "upload.png",
                        RequestBody.create(MediaType.parse("image/png"), byteArray))
                .addFormDataPart("n", "1")
                .addFormDataPart("size", "512x512")
                .build();

        Request request = new Request.Builder()
                .url(this.STABLE_DIFFUSION_API)
                .addHeader("Authorization", "Bearer " + this.API_KEY)
                .post(body)
                .build();


        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful() && response.body() != null) {
                    try {
                        String responseString = response.body().string();
                        JSONObject responseJson = new JSONObject(responseString);
                        Log.e("OpenAI", "JSONResonse: " + responseJson);
                        String imageUrl = responseJson.getJSONArray("data")
                                .getJSONObject(0).getString("url");

                        runOnUiThread(() ->
                                Picasso.with(DisplayImageActivity.this)
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

            @Override
            public void onFailure(Call call, IOException e) {
                Log.e("API", "Error: " + e.getMessage());
            }
        });
    }*/

    private void openImageChooser() {
        new AlertDialog.Builder(this)
                .setTitle("Choose Image Source")
                .setItems(new String[]{"Take Photo", "Choose from Gallery"}, (dialog, which) -> {
                    if (which == 0) openCamera();
                    else openGallery();
                })
                .show();
    }

    private void openCamera() {
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (intent.resolveActivity(getPackageManager()) != null) {
            startActivityForResult(intent, CAMERA_REQUEST_CODE);
        }
    }

    private void openGallery() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        intent.setType("image/*");
        startActivityForResult(intent, GALLERY_REQUEST_CODE);
    }
}