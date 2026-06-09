package com.dresstips.taqmish;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;
import com.squareup.picasso.Picasso;

import de.hdodenhof.circleimageview.CircleImageView;

public class ProfileActivity extends AppCompatActivity {

    private static final int PICK_IMAGE_REQUEST = 1001;

    FirebaseAuth mAuth;
    FirebaseUser firebaseUser;
    DatabaseReference userRef;

    CircleImageView profileImage;
    ImageButton changePhotoButton;
    TextView emailAddress;
    TextInputEditText firstName, lastName, countryInput, ageInput, heightInput, weightInput;
    ChipGroup genderChipGroup, bodyShapeChipGroup;
    MaterialButton saveProfileButton;
    ProgressBar progressBar;

    Uri selectedImageUri;
    String profileImageUrl = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        mAuth = FirebaseAuth.getInstance();
        firebaseUser = mAuth.getCurrentUser();

        if (firebaseUser == null) {
            startActivity(new Intent(this, MainActivity.class));
            finish();
            return;
        }

        userRef = FirebaseDatabase.getInstance().getReference("Users").child(firebaseUser.getUid());

        initViews();
        loadExistingProfile();
        setupListeners();
    }

    private void initViews() {
        profileImage = findViewById(R.id.profileImage);
        changePhotoButton = findViewById(R.id.changePhotoButton);
        emailAddress = findViewById(R.id.emailAddress);
        firstName = findViewById(R.id.firstName);
        lastName = findViewById(R.id.lastName);
        countryInput = findViewById(R.id.countryInput);
        ageInput = findViewById(R.id.ageInput);
        heightInput = findViewById(R.id.heightInput);
        weightInput = findViewById(R.id.weightInput);
        genderChipGroup = findViewById(R.id.genderChipGroup);
        bodyShapeChipGroup = findViewById(R.id.bodyShapeChipGroup);
        saveProfileButton = findViewById(R.id.saveProfileButton);
        progressBar = findViewById(R.id.progressBar);

        emailAddress.setText(firebaseUser.getEmail());
        Picasso.with(this).load(firebaseUser.getPhotoUrl()).into(profileImage);
    }

    private void loadExistingProfile() {
        userRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                User user = snapshot.getValue(User.class);
                if (user != null) {
                    if (user.firstName != null) firstName.setText(user.firstName);
                    if (user.lastName != null) lastName.setText(user.lastName);
                    if (user.country != null) countryInput.setText(user.country);
                    if (user.age != null) ageInput.setText(user.age);
                    if (user.height != null) heightInput.setText(user.height);
                    if (user.weight != null) weightInput.setText(user.weight);
                    if (user.gender != null) selectGenderChip(user.gender);
                    if (user.bodyShape != null) selectBodyShapeChip(user.bodyShape);
                    if (user.profileImageUrl != null && !user.profileImageUrl.isEmpty()) {
                        profileImageUrl = user.profileImageUrl;
                        Picasso.with(ProfileActivity.this).load(profileImageUrl).into(profileImage);
                    }
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {}
        });
    }

    private void selectGenderChip(String gender) {
        for (int i = 0; i < genderChipGroup.getChildCount(); i++) {
            Chip chip = (Chip) genderChipGroup.getChildAt(i);
            if (chip.getText().toString().equalsIgnoreCase(gender)) {
                chip.setChecked(true);
                break;
            }
        }
    }

    private void selectBodyShapeChip(String shape) {
        for (int i = 0; i < bodyShapeChipGroup.getChildCount(); i++) {
            Chip chip = (Chip) bodyShapeChipGroup.getChildAt(i);
            if (chip.getText().toString().equalsIgnoreCase(shape)) {
                chip.setChecked(true);
                break;
            }
        }
    }

    private void setupListeners() {
        changePhotoButton.setOnClickListener(v -> openImagePicker());

        saveProfileButton.setOnClickListener(v -> {
            if (validateProfile()) {
                saveProfile();
            }
        });
    }

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK);
        intent.setType("image/*");
        startActivityForResult(intent, PICK_IMAGE_REQUEST);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_IMAGE_REQUEST && resultCode == Activity.RESULT_OK && data != null && data.getData() != null) {
            selectedImageUri = data.getData();
            Picasso.with(this).load(selectedImageUri).into(profileImage);
        }
    }

    private boolean validateProfile() {
        String fn = firstName.getText().toString().trim();
        String ln = lastName.getText().toString().trim();
        String country = countryInput.getText().toString().trim();
        String age = ageInput.getText().toString().trim();
        String height = heightInput.getText().toString().trim();
        String weight = weightInput.getText().toString().trim();

        if (fn.isEmpty()) {
            firstName.setError("First name is required");
            firstName.requestFocus();
            return false;
        }
        if (ln.isEmpty()) {
            lastName.setError("Last name is required");
            lastName.requestFocus();
            return false;
        }
        if (country.isEmpty()) {
            countryInput.setError("Country is required");
            countryInput.requestFocus();
            return false;
        }
        if (age.isEmpty()) {
            ageInput.setError("Age is required");
            ageInput.requestFocus();
            return false;
        }
        if (height.isEmpty()) {
            heightInput.setError("Height is required");
            heightInput.requestFocus();
            return false;
        }
        if (weight.isEmpty()) {
            weightInput.setError("Weight is required");
            weightInput.requestFocus();
            return false;
        }

        Chip selectedGender = findViewById(genderChipGroup.getCheckedChipId());
        if (selectedGender == null) {
            Toast.makeText(this, "Please select your gender", Toast.LENGTH_SHORT).show();
            return false;
        }

        Chip selectedShape = findViewById(bodyShapeChipGroup.getCheckedChipId());
        if (selectedShape == null) {
            Toast.makeText(this, "Please select your body shape", Toast.LENGTH_SHORT).show();
            return false;
        }

        return true;
    }

    private void saveProfile() {
        progressBar.setVisibility(View.VISIBLE);
        saveProfileButton.setEnabled(false);

        if (selectedImageUri != null) {
            uploadImageAndSave();
        } else {
            saveUserData(profileImageUrl);
        }
    }

    private void uploadImageAndSave() {
        StorageReference storageRef = FirebaseStorage.getInstance().getReference()
                .child("profile_images")
                .child(firebaseUser.getUid() + ".jpg");

        storageRef.putFile(selectedImageUri)
                .addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
                    @Override
                    public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                        storageRef.getDownloadUrl().addOnSuccessListener(new OnSuccessListener<Uri>() {
                            @Override
                            public void onSuccess(Uri uri) {
                                profileImageUrl = uri.toString();
                                saveUserData(profileImageUrl);
                            }
                        });
                    }
                })
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        progressBar.setVisibility(View.GONE);
                        saveProfileButton.setEnabled(true);
                        Toast.makeText(ProfileActivity.this, "Failed to upload image", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void saveUserData(String imageUrl) {
        String fn = firstName.getText().toString().trim();
        String ln = lastName.getText().toString().trim();
        String country = countryInput.getText().toString().trim();
        String age = ageInput.getText().toString().trim();
        String height = heightInput.getText().toString().trim();
        String weight = weightInput.getText().toString().trim();

        Chip selectedGender = findViewById(genderChipGroup.getCheckedChipId());
        String gender = selectedGender.getText().toString();

        Chip selectedShape = findViewById(bodyShapeChipGroup.getCheckedChipId());
        String bodyShape = selectedShape.getText().toString();

        User user = new User(firebaseUser.getEmail(), "", fn + " " + ln);
        user.firstName = fn;
        user.lastName = ln;
        user.country = country;
        user.gender = gender;
        user.age = age;
        user.height = height;
        user.weight = weight;
        user.bodyShape = bodyShape;
        user.profileImageUrl = imageUrl;
        user.profileComplete = true;

        userRef.setValue(user).addOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
                progressBar.setVisibility(View.GONE);
                saveProfileButton.setEnabled(true);
                if (task.isSuccessful()) {
                    Toast.makeText(ProfileActivity.this, "Profile saved successfully!", Toast.LENGTH_SHORT).show();
                    goToInteractionActivity();
                } else {
                    Toast.makeText(ProfileActivity.this, "Failed to save profile. Try again.", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    private void goToInteractionActivity() {
        Intent intent = new Intent(this, InteractionActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    public void onBackPressed() {
        // Prevent going back to login without completing profile
    }
}