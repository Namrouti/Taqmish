package com.dresstips.taqmish.Activities;

import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.os.Bundle;
import android.util.Log;
import android.widget.ImageView;

import androidx.appcompat.app.AppCompatActivity;

import com.dresstips.taqmish.R;
import com.squareup.picasso.Picasso;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class DisplayImageActivityGemini extends AppCompatActivity {

    private static final String GEMINI_API_KEY = "your-gemini-api-key";
    private static final String GEMINI_ENDPOINT = "https://api.gemini.com/v1/images/edit";
    private ImageView selectedImageView;
    private ImageView editedImageView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_display_image);

        selectedImageView = findViewById(R.id.selectedImageView);
        editedImageView = findViewById(R.id.editedImageView);

        // Get the bitmap from the selected image in ImageView
        Bitmap bitmap = ((BitmapDrawable) selectedImageView.getDrawable()).getBitmap();

        try {
            // Save the bitmap as a file
            File imageFile = saveBitmapToFile(bitmap, "input.png");

            // Call the Gemini API to edit the image with a prompt
            editImageWithPrompt("Add a beach background to the image", imageFile);
        } catch (IOException e) {
            Log.e("Gemini", "Error saving image: " + e.getMessage());
        }
    }

    // Save bitmap to a file
    private File saveBitmapToFile(Bitmap bitmap, String filename) throws IOException {
        File file = new File(getFilesDir(), filename);
        FileOutputStream out = new FileOutputStream(file);
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
        out.flush();
        out.close();
        return file;
    }

    // Edit image with Gemini API
    private void editImageWithPrompt(String prompt, File imageFile) {
        OkHttpClient client = new OkHttpClient();

        MultipartBody.Builder builder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("prompt", prompt)
                .addFormDataPart("image", imageFile.getName(),
                        RequestBody.create(imageFile, MediaType.parse("image/png")))
                .addFormDataPart("size", "1024x1024");

        // Build the request body
        RequestBody requestBody = builder.build();

        // Create the API request
        Request request = new Request.Builder()
                .url(GEMINI_ENDPOINT)
                .addHeader("Authorization", "Bearer " + GEMINI_API_KEY)
                .post(requestBody)
                .build();

        // Make the API call
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e("Gemini", "API call failed: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful() && response.body() != null) {
                    try {
                        String responseString = response.body().string();
                        JSONObject responseJson = new JSONObject(responseString);
                        String imageUrl = responseJson.getJSONObject("data").getString("url");

                        runOnUiThread(() -> Picasso.with(DisplayImageActivityGemini.this).load(imageUrl).into(editedImageView));
                    } catch (Exception e) {
                        Log.e("Gemini", "Error parsing response: " + e.getMessage());
                    }
                } else {
                    Log.e("Gemini", "API error: " + response.code() + " - " + response.message());
                }
            }
        });
    }
}
