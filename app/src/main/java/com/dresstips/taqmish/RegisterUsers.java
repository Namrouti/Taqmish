package com.dresstips.taqmish;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.FirebaseDatabase;

import java.util.regex.Pattern;

import javax.xml.validation.Validator;

public class RegisterUsers extends AppCompatActivity {

    Button register;
    TextView banner;
    private EditText email,password, age, wieght, hieght, fullName;
    private ProgressBar progress;
    private ImageView imageView;
    FirebaseAuth mAuth;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register_users);

        mAuth = FirebaseAuth.getInstance();

        register = (Button) findViewById(R.id.register);
        email = (EditText) findViewById(R.id.email);
        password = (EditText) findViewById(R.id.password);
        age = (EditText) findViewById(R.id.age);
        wieght = (EditText) findViewById(R.id.wieght);
        hieght = (EditText) findViewById(R.id.hieght);
        imageView = (ImageView) findViewById(R.id.imageView);
        progress = (ProgressBar) findViewById(R.id.progressBar);
        banner = (TextView) findViewById(R.id.banner);
        fullName = (EditText) findViewById(R.id.fullname);

        register.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                registerClicked(view);
            }
        });
        banner.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                bannerClicked(view);
            }
        });

    }

    public void registerClicked(View v){
        Validate();
        progress.setVisibility(View.VISIBLE);
        mAuth.createUserWithEmailAndPassword(email.getText().toString(),password.getText().toString())
                .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        if(task.isSuccessful()){
                            User user = new User(email.getText().toString().trim(),password.getText().toString().trim(),fullName.getText().toString());
                            FirebaseDatabase.getInstance().getReference("Users")
                                    .child(FirebaseAuth.getInstance().getCurrentUser().getUid())
                                    .setValue(user).addOnCompleteListener(new OnCompleteListener<Void>() {
                                @Override
                                public void onComplete(@NonNull Task<Void> task) {
                                    if(task.isSuccessful())
                                    {
                                        Toast.makeText(RegisterUsers.this,"User Has Been Registered Successfully",Toast.LENGTH_LONG).show();
                                        progress.setVisibility(View.GONE);
                                    }
                                    else{
                                        Toast.makeText(RegisterUsers.this,"Can not add to real time database",Toast.LENGTH_LONG).show();
                                    }
                                }
                            });

                        }

                    }
                });


    }

    private void Validate() {
        String emailst = email.getText().toString();
        String passwordst = password.getText().toString();
        String fullNamest = fullName.getText().toString();
        if(emailst.isEmpty()){
            email.setError("Email is Required");
            email.requestFocus();
            return;
        }
        if(!Patterns.EMAIL_ADDRESS.matcher(emailst).matches())
        {
            email.setError("Please Enter Valid Email Address!.");
            email.requestFocus();
            return;
        }
        if(passwordst.isEmpty())
        {
            password.setError("Required Password");
            password.requestFocus();
            return;
        }
        if(passwordst.length()< 6)
        {
            password.setError("Min Password Length Should Be 6 Character ");
            password.requestFocus();
            return;

        }
        if(fullNamest.isEmpty())
        {
            fullName.setError("Required Full Name");
            fullName.requestFocus();
            return;
        }

    }

    public void bannerClicked(View v)
    {
        startActivity(new Intent(this, MainActivity.class));
    }
}