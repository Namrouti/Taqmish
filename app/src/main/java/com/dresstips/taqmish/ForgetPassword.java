package com.dresstips.taqmish;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;

public class ForgetPassword extends AppCompatActivity {
    private EditText emailEdittext ;
    TextView message;
    private Button resetButton;
    private ProgressBar progress;
    FirebaseAuth mAuth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forget_password);
        
        emailEdittext = (EditText) findViewById(R.id.email);
        resetButton = (Button) findViewById(R.id.RestPasswor);
        progress = (ProgressBar) findViewById(R.id.progressBar);
        message = (TextView) findViewById(R.id.message);

        mAuth =FirebaseAuth.getInstance();
        
        resetButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                resetClicked(view);
            }
        });
        
    }

    private void resetClicked(View view) {
        message.setText("");
        String email = emailEdittext.getText().toString().trim();
        if(!Patterns.EMAIL_ADDRESS.matcher(email).matches())
        {
            emailEdittext.setError("Invalid Email Address");
            emailEdittext.requestFocus();
            return;
        }
        if(email.isEmpty())
        {
            emailEdittext.setError("Please Insert the Email Address");
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
                    message.setText("an email send, Check your email to reset Password");
                }
                else
                {
                    Toast.makeText(ForgetPassword.this,"Try Again! Something went wrong",Toast.LENGTH_LONG).show();
                    message.setText("Try Again! Something Went Wrong");
                }
                progress.setVisibility(View.GONE);

            }
        });
    }
}