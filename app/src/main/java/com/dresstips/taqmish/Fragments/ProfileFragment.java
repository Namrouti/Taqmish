package com.dresstips.taqmish.Fragments;

import static android.app.Activity.RESULT_OK;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.NumberPicker;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.dresstips.taqmish.MainActivity;
import com.dresstips.taqmish.ProfileActivity;
import com.dresstips.taqmish.R;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.UserProfileChangeRequest;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.hbb20.CountryCodePicker;
import com.squareup.picasso.Picasso;

import java.util.Calendar;

import de.hdodenhof.circleimageview.CircleImageView;

public class ProfileFragment extends Fragment {

    private static final int PICK_IMAGE_REQUEST = 12;
    String photoUrl = "";


    Button logout;
    FirebaseAuth mAuth;
    FirebaseUser user;
    DatabaseReference reference;
    String userID;
    View view;

    TextView emailAddress;
    CircleImageView profileImage;
    RadioGroup genderRadioGroup;
    RadioButton femailRadioButton, mailRadioButton;
    CountryCodePicker countryCodePicker;
    NumberPicker tallPicker,wieghtPicker,agePicker,dayPicker, monthPicker, yearPicker;
    Button saveProfile;


    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {

        view = inflater.inflate(R.layout.activity_profile,container,false);


        logout =  view.findViewById(R.id.logout);
        mAuth = FirebaseAuth.getInstance();

        emailAddress = view.findViewById(R.id.emailAddress);
        profileImage = view.findViewById(R.id.profileImage);
        genderRadioGroup = view.findViewById(R.id.genderRadioGroup);
        mailRadioButton = view.findViewById(R.id.maleRadioButton);
        femailRadioButton = view.findViewById(R.id.femaleRadioButton);
        countryCodePicker = view.findViewById(R.id.countryCodePicker);

        tallPicker = view.findViewById(R.id.tallPicker);
        wieghtPicker = view.findViewById(R.id.wiehgtPicker);
        agePicker = view.findViewById(R.id.agePicker);
        dayPicker = this.getActivity().findViewById(R.id.dayPicker);
        monthPicker = view.findViewById(R.id.monthPicker);
        yearPicker = view.findViewById(R.id.yearPicker);

        saveProfile = view.findViewById(R.id.saveProfile);

       tallPicker.setMinValue(40);
       tallPicker.setMaxValue(210);
       tallPicker.setValue(100);

       wieghtPicker.setMinValue(3);
       wieghtPicker.setMaxValue(150);
       wieghtPicker.setValue(75);

       agePicker.setMinValue(1);
       agePicker.setMaxValue(80);
       agePicker.setValue(20);

       monthPicker.setValue(1);
       monthPicker.setMaxValue(12);
       monthPicker.setValue(6);

       yearPicker.setMinValue(1900);
       yearPicker.setMaxValue(2023);
       yearPicker.setValue(2000);



        logout.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                mAuth.signOut();
                startActivity(new Intent(ProfileFragment.this.getActivity(), MainActivity.class));
            }
        });

        user = FirebaseAuth.getInstance().getCurrentUser();
        reference = FirebaseDatabase.getInstance().getReference("Users");
        userID = user.getUid();

        emailAddress.setText(user.getEmail());
        if(profileImage.getDrawable() == null)
        {
            profileImage.setImageResource(R.drawable.ic_person);
        }
        else {
            Picasso.with(this.getContext()).load(user.getPhotoUrl()).into(profileImage);
        }
        profileImage.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                chooseProfileImage(v);
            }
        });

        return view;
    }

    private void chooseProfileImage(View v) {
        Intent intent = new Intent();
        intent.setType("image/*");
        intent.setAction(Intent.ACTION_GET_CONTENT);

        // Launch the Intent and wait for a result
        startActivityForResult(Intent.createChooser(intent, "Select Picture"), PICK_IMAGE_REQUEST);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_IMAGE_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            // Get the image URI from the Intent result
            Uri imageUri = data.getData();

            // Upload the image to Firebase Storage and get the download URL
            StorageReference storageRef = FirebaseStorage.getInstance().getReference().child("profile_images").child(user.getUid());
            storageRef.putFile(imageUri).addOnSuccessListener(taskSnapshot -> {
                storageRef.getDownloadUrl().addOnSuccessListener(uri -> {
                    // Update the user's profile image URL
                    photoUrl = uri.toString();
                    UserProfileChangeRequest profileUpdates = new UserProfileChangeRequest.Builder()
                            .setPhotoUri(Uri.parse(photoUrl))
                            .build();

                    user.updateProfile(profileUpdates)
                            .addOnCompleteListener(task -> {
                                if (task.isSuccessful()) {
                                    Picasso.with(ProfileFragment.this.getContext()).load(user.getPhotoUrl()).into(profileImage);
                                } else {
                                    // Profile image update failed
                                }
                            });
                });
            }).addOnFailureListener(exception -> {
                // Handle any errors that occur during image upload
            });
        }
    }
}
