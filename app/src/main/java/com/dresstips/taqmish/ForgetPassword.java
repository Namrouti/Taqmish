package com.dresstips.taqmish;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.content.Intent;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;

public class ForgetPassword extends AppCompatActivity {
    private TextInputEditText emailEdittext;
    TextView message;
    private MaterialButton resetButton;
    private ProgressBar progress;
    private TextView backToLogin;
    FirebaseAuth mAuth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forget_password);
        
        emailEdittext = findViewById(R.id.email);
        resetButton = findViewById(R.id.RestPasswor);
        progress = findViewById(R.id.progressBar);
        message = findViewById(R.id.message);
        backToLogin = findViewById(R.id.backToLogin);

        mAuth =FirebaseAuth.getInstance();
        
        resetButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                resetClicked(view);
            }
        });

        backToLogin.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(ForgetPassword.this, MainActivity.class));
                finish();
            }
        });
        
    }

    private void resetClicked(View view) {
        message.setVisibility(View.GONE);
        String email = emailEdittext.getText().toString().trim();
        if(email.isEmpty())
        {
            emailEdittext.setError("Please enter your email address");
            emailEdittext.requestFocus();
            return;
        }
        if(!Patterns.EMAIL_ADDRESS.matcher(email).matches())
        {
            emailEdittext.setError("Please enter a valid email address");
            emailEdittext.requestFocus();
            return;
        }

        progress.setVisibility(View.VISIBLE);

        mAuth.sendPasswordResetEmail(email).addOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
                if(task.isSuccessful())
                {
                    Toast.makeText(ForgetPassword.this,"Please Check your email to reset Password!",Toast.LENGTH_LONG).show();
                    message.setVisibility(View.VISIBLE);
                    message.setText("An email has been sent. Check your email to reset your password.");
                }
                else
                {
                    Toast.makeText(ForgetPassword.this,"Try Again! Something went wrong",Toast.LENGTH_LONG).show();
                    message.setVisibility(View.VISIBLE);
                    message.setText("Try Again! Something went wrong.");
                }
                progress.setVisibility(View.GONE);

            }
        });
    }
}