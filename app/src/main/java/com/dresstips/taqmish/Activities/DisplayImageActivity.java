package com.dresstips.taqmish.Activities;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.ImageView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Adapters.SimilarImagesAdapter;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.models.SimilarImage;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class DisplayImageActivity extends AppCompatActivity {
    private ImageView selectedImageView;
    private RecyclerView similarImagesRecyclerView;
    SimilarImagesAdapter adapter;
    private static final String OPENAI_API_KEY = "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";
    private static final String OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_display_image);

        initView();
    }

    private void initView() {
        initImageView();
        initRecyclerView();
    }

    private void initImageView() {
        selectedImageView = findViewById(R.id.selectedImageView);

        // Retrieve and display the selected image (Example: from Intent)
        Intent intent = getIntent();
        if (intent != null && intent.hasExtra("imageUri")) {
            Uri imageUri = Uri.parse(intent.getStringExtra("imageUri"));
            selectedImageView.setImageURI(imageUri);
        }
    }

    private void initRecyclerView() {
        similarImagesRecyclerView = findViewById(R.id.similarImagesRecyclerView);
        similarImagesRecyclerView.setLayoutManager(new GridLayoutManager(this, 2));

        // Get the selected image from Intent
        Intent intent = getIntent();
        Uri imageUri = null;
        if (intent != null && intent.hasExtra("imageUri")) {
            imageUri = Uri.parse(intent.getStringExtra("imageUri"));
        }

        // Fetch similar images from OpenAI
        List<SimilarImage> similarImageList = getSimilarImages(imageUri);

        // Initialize RecyclerView Adapter
        adapter = new SimilarImagesAdapter(similarImageList, this::onItemSelected);
        similarImagesRecyclerView.setAdapter(adapter);
    }

    // Example function to get a list of similar images
    private List<SimilarImage> getSimilarImages(Uri imageUri) {
        List<SimilarImage> images = new ArrayList<>();

        OkHttpClient client = new OkHttpClient();

        // Prepare JSON request
        JSONObject jsonRequest = new JSONObject();
        try {
            jsonRequest.put("model", "gpt-4-vision-preview");
            jsonRequest.put("messages", new JSONArray()
                    .put(new JSONObject().put("role", "system")
                            .put("content", "You are an AI that finds visually similar fashion images."))
                    .put(new JSONObject().put("role", "user")
                            .put("content", "Find similar outfits to this image and return JSON with image URL, gender, and season.")
                            .put("image_url", imageUri.toString())));
            jsonRequest.put("max_tokens", 100);
        } catch (Exception e) {
            e.printStackTrace();
            return images;
        }

        // Create request
        RequestBody body = RequestBody.create(jsonRequest.toString(), MediaType.get("application/json"));
        Request request = new Request.Builder()
                .url(OPENAI_ENDPOINT)
                .header("Authorization", "Bearer " + OPENAI_API_KEY)
                .post(body)
                .build();

        // Execute request (runs asynchronously)
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                e.printStackTrace();
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    try {
                        String responseBody = response.body().string();
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        JSONArray choices = jsonResponse.getJSONArray("choices");
                        if (choices.length() > 0) {
                            String content = choices.getJSONObject(0).getString("text");
                            JSONArray similarImagesJson = new JSONArray(content);

                            for (int i = 0; i < similarImagesJson.length(); i++) {
                                JSONObject obj = similarImagesJson.getJSONObject(i);
                                String imageUrl = obj.getString("image_url");
                                String gender = obj.getString("gender");
                                String season = obj.getString("season");

                                images.add(new SimilarImage(imageUrl, gender, season));
                            }

                            // Refresh RecyclerView on UI Thread
                            runOnUiThread(() -> {
                                adapter.updateList(images);
                            });
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        });

        return images; // Initially returns empty list (API call is async)
    }
    // Callback function for item selection
    private void onItemSelected(SimilarImage item) {
        item.setSelected(!item.isSelected()); // Toggle selection state
        adapter.notifyDataSetChanged(); // Refresh RecyclerView
    }
}