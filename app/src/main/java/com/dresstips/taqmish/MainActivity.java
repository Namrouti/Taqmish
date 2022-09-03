package com.dresstips.taqmish;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.util.Patterns;
import android.view.Menu;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;


import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

import org.opencv.android.OpenCVLoader;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

public class MainActivity extends AppCompatActivity {

    TextView register;
    EditText email, password;
    Button login;
    FirebaseAuth mAuth;
    ProgressBar progress;
    FirebaseUser user;
    private static  String LOGTAG = "Open_CV";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        startActivity(new Intent(MainActivity.this,InteractionActivity.class));


        //initiate variables;

        register = (TextView)  findViewById(R.id.register);
        email = (EditText) findViewById(R.id.email);
        password = (EditText) findViewById(R.id.password);
        login =(Button) findViewById(R.id.signin);
        progress = (ProgressBar) findViewById(R.id.progressBar);
        mAuth = FirebaseAuth.getInstance();


        login.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                loginClicked(view);
            }


        });



        register.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                registerClicked(view);
            }
        });

        if(FirebaseAuth.getInstance().getCurrentUser() != null)
        {
            startActivity(new Intent(MainActivity.this,InteractionActivity.class));
        }

    }


    public void loginClicked(View view) {

        String emailst = email.getText().toString().trim();
        String passwordst = password.getText().toString().trim();
        if(emailst.isEmpty())
        {
            email.setError("Email is required");
            email.requestFocus();
            return;
        }
        if(!Patterns.EMAIL_ADDRESS.matcher(emailst).matches())
        {
            email.setError("Invalid Email Address");
            email.requestFocus();
            return;
        }
        if(passwordst.isEmpty() )
        {
            password.setError("Password Required");
            password.requestFocus();
            return;
        }

        progress.setVisibility(View.VISIBLE);

        mAuth.signInWithEmailAndPassword(emailst,passwordst).addOnCompleteListener(new OnCompleteListener<AuthResult>() {
            @Override
            public void onComplete(@NonNull Task<AuthResult> task) {
                if(task.isSuccessful())
                {
                    user = FirebaseAuth.getInstance().getCurrentUser();
                    //redirect to profile
                    startActivity(new Intent(MainActivity.this,InteractionActivity.class));
                }
                else
                {
                    Toast.makeText(MainActivity.this,"Inavlid Credintials, Try Again",Toast.LENGTH_LONG).show();
                }
            }
        });

    }
    public void registerClicked(View view)
    {
        startActivity(new Intent(this, RegisterUsers.class));
    }
}