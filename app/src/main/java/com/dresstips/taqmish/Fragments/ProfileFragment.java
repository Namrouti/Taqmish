package com.dresstips.taqmish.Fragments;

import static android.app.Activity.RESULT_OK;

import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.icu.util.Calendar;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.DatePicker;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.User;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.Profile;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.UserProfileChangeRequest;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.squareup.picasso.Picasso;

import de.hdodenhof.circleimageview.CircleImageView;

public class ProfileFragment extends Fragment {

    private static final int PICK_IMAGE_REQUEST = 12;
    String photoUrl = "";

    MaterialButton saveProfile;
    FirebaseAuth mAuth;
    FirebaseUser user;
    DatabaseReference userRef;
    String userID;
    View view;

    TextView emailAddress;
    CircleImageView profileImage;
    ChipGroup genderChipGroup, bodyShapeChipGroup;
    TextInputEditText weight, height, skinColor, firstName, lastName, birthdate, countryInput;

    Profile mProfile;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {

        view = inflater.inflate(R.layout.fragment_profile, container, false);

        mProfile = new Profile();
        mAuth = FirebaseAuth.getInstance();
        user = FirebaseAuth.getInstance().getCurrentUser();

        if (user == null) return view;

        emailAddress = view.findViewById(R.id.emailAddress);
        profileImage = view.findViewById(R.id.profileImage);
        genderChipGroup = view.findViewById(R.id.genderChipGroup);
        bodyShapeChipGroup = view.findViewById(R.id.bodyShapeChipGroup);
        birthdate = view.findViewById(R.id.birthdate);
        weight = view.findViewById(R.id.weight);
        height = view.findViewById(R.id.height);
        skinColor = view.findViewById(R.id.skincolor);
        lastName = view.findViewById(R.id.lastName);
        firstName = view.findViewById(R.id.firstName);
        countryInput = view.findViewById(R.id.countryInput);
        saveProfile = view.findViewById(R.id.saveProfile);

        userRef = FirebaseDatabase.getInstance().getReference("Users").child(user.getUid());
        userID = user.getUid();
        checkProfile();

        birthdate.setOnClickListener(v -> {
            Calendar calendar = Calendar.getInstance();
            int year = calendar.get(Calendar.YEAR);
            int month = calendar.get(Calendar.MONTH);
            int day = calendar.get(Calendar.DAY_OF_MONTH);

            DatePickerDialog datePickerDialog = new DatePickerDialog(getContext(), (view1, selectedYear, selectedMonth, selectedDayOfMonth) -> {
                birthdate.setText(selectedDayOfMonth + "-" + (selectedMonth + 1) + "-" + selectedYear);
            }, year, month, day);
            datePickerDialog.show();
        });

        skinColor.setOnClickListener(v -> {
            AlertDialog.Builder builder = new AlertDialog.Builder(ProfileFragment.this.getContext());
            LayoutInflater inflater1 = getLayoutInflater();
            View dialogView = inflater1.inflate(R.layout.skin_color_chooser, null);
            builder.setView(dialogView);

            ImageView skinColorImage = dialogView.findViewById(R.id.skinColorImage);
            TextView hextxt = dialogView.findViewById(R.id.hex);
            skinColorImage.setDrawingCacheEnabled(true);
            skinColorImage.buildDrawingCache(true);
            skinColorImage.setOnTouchListener((v1, event) -> {
                if (event.getAction() == MotionEvent.ACTION_DOWN || event.getAction() == MotionEvent.ACTION_MOVE) {
                    Bitmap bitmap = skinColorImage.getDrawingCache();
                    int x = (int) event.getX();
                    int y = (int) event.getY();
                    if (x >= 0 && x < bitmap.getWidth() && y >= 0 && y < bitmap.getHeight()) {
                        int pixel = bitmap.getPixel(x, y);
                        int r = Color.red(pixel);
                        int g = Color.green(pixel);
                        int b = Color.blue(pixel);
                        String hex = String.format("#%02x%02x%02x", r, g, b);
                        hextxt.setBackgroundColor(Color.rgb(r, g, b));
                        hextxt.setText(hex);
                    }
                }
                return true;
            });

            builder.setPositiveButton("OK", (dialog, which) -> {
                skinColor.setText(hextxt.getText());
                try {
                    skinColor.setBackgroundColor(Color.parseColor(hextxt.getText().toString()));
                } catch (Exception ignored) {}
            });

            builder.setNegativeButton("Cancel", (dialog, which) -> dialog.dismiss());

            AlertDialog dialog = builder.create();
            dialog.show();
        });

        emailAddress.setText(user.getEmail());
        if (user.getPhotoUrl() != null) {
            Picasso.with(this.getContext()).load(user.getPhotoUrl()).into(profileImage);
        }

        profileImage.setOnClickListener(v -> chooseProfileImage(v));

        saveProfile.setOnClickListener(v -> saveProfileData());

        return view;
    }

    private void checkProfile() {
        // Load from Profile class (existing data)
        General.getDataBaseRefrenece(Profile.class.getSimpleName()).child(user.getUid()).get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                mProfile = dataSnapshot.getValue(Profile.class);
                if (mProfile != null) {
                    if (mProfile.getSex() != null) {
                        selectGenderChip(mProfile.getSex());
                    }
                    if (mProfile.getCountryNameCode() != null) {
                        countryInput.setText(mProfile.getCountryName());
                    }
                    weight.setText(mProfile.getWeight() + "");
                    height.setText(mProfile.getHeight() + "");
                    firstName.setText(mProfile.getFirstName());
                    lastName.setText(mProfile.getLastName());
                    birthdate.setText(mProfile.getBirthDate());
                    if (mProfile.getSkinColor() != null) {
                        skinColor.setText(mProfile.getSkinColor());
                        try {
                            skinColor.setBackgroundColor(Color.parseColor(mProfile.getSkinColor()));
                        } catch (Exception ignored) {}
                    }
                } else {
                    mProfile = new Profile();
                }
            }
        });

        // Also load from User class for new fields
        userRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                User u = snapshot.getValue(User.class);
                if (u != null) {
                    if (u.firstName != null) firstName.setText(u.firstName);
                    if (u.lastName != null) lastName.setText(u.lastName);
                    if (u.country != null) countryInput.setText(u.country);
                    if (u.height != null) height.setText(u.height);
                    if (u.weight != null) weight.setText(u.weight);
                    if (u.gender != null) selectGenderChip(u.gender);
                    if (u.bodyShape != null) selectBodyShapeChip(u.bodyShape);
                    if (u.profileImageUrl != null && !u.profileImageUrl.isEmpty()) {
                        Picasso.with(getContext()).load(u.profileImageUrl).into(profileImage);
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

    private void saveProfileData() {
        String fn = firstName.getText() != null ? firstName.getText().toString().trim() : "";
        String ln = lastName.getText() != null ? lastName.getText().toString().trim() : "";
        String country = countryInput.getText() != null ? countryInput.getText().toString().trim() : "";
        String h = height.getText() != null ? height.getText().toString().trim() : "0";
        String w = weight.getText() != null ? weight.getText().toString().trim() : "0";
        String bd = birthdate.getText() != null ? birthdate.getText().toString().trim() : "";
        String sc = skinColor.getText() != null ? skinColor.getText().toString().trim() : "";

        String gender = "";
        Chip genderChip = view.findViewById(genderChipGroup.getCheckedChipId());
        if (genderChip != null) gender = genderChip.getText().toString();

        String bodyShape = "";
        Chip shapeChip = view.findViewById(bodyShapeChipGroup.getCheckedChipId());
        if (shapeChip != null) bodyShape = shapeChip.getText().toString();

        // Save to Profile class (legacy)
        mProfile.setFirstName(fn);
        mProfile.setLastName(ln);
        mProfile.setSkinColor(sc);
        try { mProfile.setHeight(Integer.parseInt(h)); } catch (Exception e) { mProfile.setHeight(0); }
        try { mProfile.setWeight(Integer.parseInt(w)); } catch (Exception e) { mProfile.setWeight(0); }
        mProfile.setBirthDate(bd);
        mProfile.setSex(gender);
        General.getDataBaseRefrenece(Profile.class.getSimpleName()).child(user.getUid()).setValue(mProfile);

        // Save to User class (new)
        User userObj = new User(user.getEmail(), "", fn + " " + ln);
        userObj.firstName = fn;
        userObj.lastName = ln;
        userObj.country = country;
        userObj.gender = gender;
        userObj.age = "";
        userObj.height = h;
        userObj.weight = w;
        userObj.bodyShape = bodyShape;
        userObj.profileImageUrl = photoUrl.isEmpty() ? (user.getPhotoUrl() != null ? user.getPhotoUrl().toString() : "") : photoUrl;
        userObj.profileComplete = true;

        userRef.setValue(userObj).addOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
                if (task.isSuccessful()) {
                    Toast.makeText(getContext(), "Profile saved successfully!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(getContext(), "Failed to save profile.", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    private void chooseProfileImage(View v) {
        Intent intent = new Intent();
        intent.setType("image/*");
        intent.setAction(Intent.ACTION_GET_CONTENT);
        startActivityForResult(Intent.createChooser(intent, "Select Picture"), PICK_IMAGE_REQUEST);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_IMAGE_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            Uri imageUri = data.getData();

            StorageReference storageRef = FirebaseStorage.getInstance().getReference().child("profile_images").child(user.getUid());
            storageRef.putFile(imageUri).addOnSuccessListener(taskSnapshot -> {
                storageRef.getDownloadUrl().addOnSuccessListener(uri -> {
                    photoUrl = uri.toString();
                    UserProfileChangeRequest profileUpdates = new UserProfileChangeRequest.Builder()
                            .setPhotoUri(Uri.parse(photoUrl))
                            .build();
                    General.getDataBaseRefrenece("ProfileImage").child(userID).setValue(photoUrl);

                    user.updateProfile(profileUpdates)
                            .addOnCompleteListener(task -> {
                                if (task.isSuccessful()) {
                                    Picasso.with(ProfileFragment.this.getContext()).load(user.getPhotoUrl()).into(profileImage);
                                }
                            });
                });
            }).addOnFailureListener(exception -> {});
        }
    }
}
