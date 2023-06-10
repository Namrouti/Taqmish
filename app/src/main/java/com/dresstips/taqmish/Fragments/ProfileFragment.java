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
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.NumberPicker;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.Fragment;

import com.dresstips.taqmish.MainActivity;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.Profile;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.UserProfileChangeRequest;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.hbb20.CountryCodePicker;
import com.squareup.picasso.Picasso;

import de.hdodenhof.circleimageview.CircleImageView;

public class ProfileFragment extends Fragment {

    private static final int PICK_IMAGE_REQUEST = 12;
    String photoUrl = "";


    ImageButton saveProfile;
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
    EditText weight, height, skinColor, firstName, lastName, birthdate;



    Profile mProfile;


    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {

        view = inflater.inflate(R.layout.activity_profile,container,false);

        mProfile = new Profile();
        mAuth = FirebaseAuth.getInstance();
        user = FirebaseAuth.getInstance().getCurrentUser();

        emailAddress = view.findViewById(R.id.emailAddress);
        profileImage = view.findViewById(R.id.profileImage);
        genderRadioGroup = view.findViewById(R.id.genderRadioGroup);
        mailRadioButton = view.findViewById(R.id.maleRadioButton);
        femailRadioButton = view.findViewById(R.id.femaleRadioButton);
        countryCodePicker = view.findViewById(R.id.countryCodePicker);
        birthdate = view.findViewById(R.id.birthdate);
        weight = view.findViewById(R.id.weight);
        height = view.findViewById(R.id.height);
        skinColor = view.findViewById(R.id.skincolor);
        weight = view.findViewById(R.id.weight);
        weight = view.findViewById(R.id.weight);
        lastName = view.findViewById(R.id.lastName);
        firstName = view.findViewById(R.id.firstName);
        saveProfile = view.findViewById(R.id.saveProfile);

        reference = FirebaseDatabase.getInstance().getReference("Users");
        userID = user.getUid();
        checkProfile();



        birthdate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Calendar calendar = Calendar.getInstance();
                int year = calendar.get(Calendar.YEAR);
                int month = calendar.get(Calendar.MONTH);
                int day = calendar.get(Calendar.DAY_OF_MONTH);

                // Create a DatePickerDialog to display the calendar
                DatePickerDialog datePickerDialog = new DatePickerDialog(getContext(), new DatePickerDialog.OnDateSetListener() {
                    @Override
                    public void onDateSet(DatePicker view, int selectedYear, int selectedMonth, int selectedDayOfMonth) {
                        // Handle the selected date
                        // You can use the selectedYear, selectedMonth, and selectedDayOfMonth values
                        birthdate.setText(selectedDayOfMonth + "-" + selectedMonth + "-" + selectedYear);
                    }
                }, year, month, day);



                // Show the DatePickerDialog
                datePickerDialog.show();
            }
        });

        skinColor.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                AlertDialog.Builder builder = new AlertDialog.Builder(ProfileFragment.this.getContext());
                LayoutInflater inflater = getLayoutInflater();
                View dialogView = inflater.inflate(R.layout.skin_color_chooser, null);
                builder.setView(dialogView);

                ImageView skinColorImage = dialogView.findViewById(R.id.skinColorImage);
                TextView hextxt = dialogView.findViewById(R.id.hex);
                skinColorImage.setDrawingCacheEnabled(true);
                skinColorImage.buildDrawingCache(true);
                skinColorImage.setOnTouchListener(new View.OnTouchListener() {
                    @Override
                    public boolean onTouch(View v, MotionEvent event) {
                        if(event.getAction() == MotionEvent.ACTION_DOWN  || event.getAction()== MotionEvent.ACTION_MOVE)
                        {
                            Bitmap bitmap = skinColorImage.getDrawingCache();
                            int pixel = bitmap.getPixel((int) event.getX(),(int) event.getY());

                            int r = Color.red(pixel);
                            int g = Color.green(pixel);
                            int b = Color.blue(pixel);

                            String hex =  String.format("#%02x%02x%02x", r, g, b);
                            hextxt.setBackgroundColor(Color.rgb(r,g,b));
                            hextxt.setText(hex);
                        }
                        return true;
                    }
                });

                builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        // Handle the color selection here
                        skinColor.setText(hextxt.getText());
                        skinColor.setBackgroundColor(Color.parseColor(hextxt.getText().toString()));
                    }
                });

                builder.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.dismiss();
                    }
                });

                // Create and show the AlertDialog
                AlertDialog dialog = builder.create();
                dialog.show();

            }
        });

        genderRadioGroup.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                if(checkedId != -1)
                {
                    RadioButton rb = view.findViewById(checkedId);
                    mProfile.setSex(rb.getText().toString());
                }
            }
        });

        countryCodePicker.setOnCountryChangeListener(new CountryCodePicker.OnCountryChangeListener() {
            @Override
            public void onCountrySelected() {
                mProfile.setCountryCode(countryCodePicker.getSelectedCountryCode());
                mProfile.setCountryName(countryCodePicker.getSelectedCountryName());
                mProfile.setCountryNameCode(countryCodePicker.getSelectedCountryNameCode());
            }
        });

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

        saveProfile.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mProfile.setFirstName(firstName.getText().toString());
                mProfile.setLastName(lastName.getText().toString());
                mProfile.setSkinColor(skinColor.getText().toString());
                mProfile.setHeight(Integer.parseInt(height.getText().toString()));
                mProfile.setWeight(Integer.parseInt(weight.getText().toString()));
                mProfile.setBirthDate(birthdate.getText().toString());
                General.getDataBaseRefrenece(Profile.class.getSimpleName()).child(user.getUid()).setValue(mProfile);
            }
        });

        return view;
    }

    private void checkProfile() {
        General.getDataBaseRefrenece(Profile.class.getSimpleName()).child(user.getUid()).get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                mProfile = dataSnapshot.getValue(Profile.class);
                if(mProfile != null)
                {
                    if(mProfile.getSex().equals("Male"))
                    {
                        mailRadioButton.setChecked(true);
                    }
                    else if(mProfile.getSex().equals("Female"))
                    {
                        femailRadioButton.setChecked(true);
                    }
                    countryCodePicker.setCountryForNameCode(mProfile.getCountryNameCode());
                    weight.setText(mProfile.getWeight() + "");
                    height.setText(mProfile.getHeight() + "" );
                    firstName.setText(mProfile.getFirstName());
                    lastName.setText(mProfile.getLastName());
                    birthdate.setText(mProfile.getBirthDate());
                    if(mProfile.getSkinColor() != null)
                    {
                        skinColor.setText(mProfile.getSkinColor());
                        skinColor.setBackgroundColor(Color.parseColor(mProfile.getSkinColor()));
                    }


                }
                else
                {
                    mProfile = new Profile();
                }

            }
        });
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
                    General.getDataBaseRefrenece("ProfileImage").child(userID).setValue(photoUrl);

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
