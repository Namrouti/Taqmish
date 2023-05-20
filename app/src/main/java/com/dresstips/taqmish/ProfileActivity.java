package com.dresstips.taqmish;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.NumberPicker;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.hbb20.CountryCodePicker;
import com.squareup.picasso.Picasso;

import org.w3c.dom.Text;

import de.hdodenhof.circleimageview.CircleImageView;

public class ProfileActivity extends AppCompatActivity {


    FirebaseAuth mAuth;
    FirebaseUser user;
    DatabaseReference reference;
    String userID;

    TextView emailAddress;
    CircleImageView profileImage;
    RadioGroup genderRadioGroup;
    RadioButton femailRadioButton, mailRadioButton;
    CountryCodePicker countryCodePicker;
    NumberPicker tallPicker,wieghtPicker,agePicker,dayPicker, monthPicker, yearPicker;
    Button saveProfile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        mAuth = FirebaseAuth.getInstance();

        emailAddress = this.findViewById(R.id.emailAddress);
        profileImage = this.findViewById(R.id.profileImage);
        genderRadioGroup = findViewById(R.id.genderRadioGroup);
        mailRadioButton = findViewById(R.id.maleRadioButton);
        femailRadioButton = findViewById(R.id.femaleRadioButton);
        countryCodePicker = findViewById(R.id.countryCodePicker);





        user = FirebaseAuth.getInstance().getCurrentUser();
        reference = FirebaseDatabase.getInstance().getReference("Users");
        userID = user.getUid();

        emailAddress.setText(user.getEmail());
        Picasso.with(this).load(user.getPhotoUrl()).into(profileImage);




    }
}