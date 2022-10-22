package com.dresstips.taqmish;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.app.ProgressDialog;
import android.content.Intent;
import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.view.WindowManager;
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
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.FirebaseDatabase;

import java.util.regex.Pattern;

import javax.xml.validation.Validator;

public class RegisterUsers extends AppCompatActivity {

    TextView haveAccount;
    EditText email,password,confirmPassword;
    Button register;
    ProgressDialog progressDialog;

    FirebaseAuth mAuth;
    FirebaseUser mUser;

    String emailstr ;
    String passwordstr;
    String confirmPass;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register_users);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,WindowManager.LayoutParams.FLAG_FULLSCREEN);
        mAuth = FirebaseAuth.getInstance();
        mUser = FirebaseAuth.getInstance().getCurrentUser();

        haveAccount = findViewById(R.id.havAccount);
        email = findViewById(R.id.email);
        password = findViewById(R.id.inputPassword);
        confirmPassword = findViewById(R.id.confirmPassword);
        register = findViewById(R.id.register);
        progressDialog = new ProgressDialog(this);
        
        haveAccount.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(RegisterUsers.this, MainActivity.class));
            }
        });
        register.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                performAuth(v);
            }
        });

    }

    private void performAuth(View v) {
         emailstr = email.getText().toString();
         passwordstr = password.getText().toString();
         confirmPass = confirmPassword.getText().toString();

        if(validData())
        {
            progressDialog.setMessage("Please Wait ....");
            progressDialog.setTitle("Registration");
            progressDialog.setCanceledOnTouchOutside(false);
            progressDialog.show();

            mAuth.createUserWithEmailAndPassword(emailstr,passwordstr).addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                @Override
                public void onComplete(@NonNull Task<AuthResult> task) {

                    if(task.isSuccessful()){
                        Toast.makeText(RegisterUsers.this,"User Has Been Registered Successfully",Toast.LENGTH_LONG).show();
                        progressDialog.dismiss();
                        sendUserToNextActivity();
                        User user = new User(email.getText().toString().trim(),password.getText().toString().trim(),"fullName.getText().toString()");
                        FirebaseDatabase.getInstance().getReference("Users")
                                .child(FirebaseAuth.getInstance().getCurrentUser().getUid())
                                .setValue(user).addOnCompleteListener(new OnCompleteListener<Void>() {
                            @Override
                            public void onComplete(@NonNull Task<Void> task) {
                                if(task.isSuccessful())
                                {



                                }

                            }
                        });

                    }
                    else{
                        progressDialog.dismiss();
                        Toast.makeText(RegisterUsers.this,task.getException().toString(),Toast.LENGTH_LONG).show();
                    }
                }
            });

        }
    }

    private void sendUserToNextActivity() {
        Intent intent = new Intent(this,InteractionActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
    }

    public boolean validData()
    {

        if(emailstr.isEmpty())
        {
            email.setError("This field is required!");
            email.requestFocus();
            return  false;
        }
        if(!Patterns.EMAIL_ADDRESS.matcher(emailstr).matches())
        {
            email.setError("Please Enter Valid Email Address !..");
            email.requestFocus();
            return  false;
        }
        if(passwordstr.isEmpty())
        {
            password.setError("Required filed!..");
            password.requestFocus();
            return false;
        }
        if(confirmPass.isEmpty())
        {
            confirmPassword.setError("Required Filed!..");
            confirmPassword.requestFocus();
            return false;
        }
        if(!passwordstr.equals(confirmPass))
        {
            confirmPassword.setError("not the same as password!..");
            confirmPassword.requestFocus();
            return false;
        }
        return true;
    }
}