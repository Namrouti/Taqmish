package com.dresstips.taqmish;

import static android.content.ContentValues.TAG;

import android.app.ProgressDialog;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.util.Patterns;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;

public class MainActivity extends AppCompatActivity {

    private static final int RC_SIGN_IN = 1;
    TextView createNewAccount,forgotPassword;

   EditText emailAddress,passwordtxt;
   Button login;
   ImageView google,facebook,phone,tweeter,github;

   FirebaseAuth mAuth;
   FirebaseUser mUser;

   ProgressDialog progressDialog;
   //for google auth
  GoogleSignInClient mGoogleSignInClient;
   
   String email,password;
   
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,WindowManager.LayoutParams.FLAG_FULLSCREEN);

        createNewAccount = findViewById(R.id.createNewAccount);
        emailAddress = findViewById(R.id.email);
        passwordtxt = findViewById(R.id.inputPassword);
        login = findViewById(R.id.btn_login);
        forgotPassword = findViewById(R.id.fogetPassword);

        google = findViewById(R.id.google);
        facebook = findViewById(R.id.facebook);
        phone = findViewById(R.id.phone);
        tweeter = findViewById(R.id.tweeter);
        github = findViewById(R.id.github);
        
        mAuth = FirebaseAuth.getInstance();
        mUser =mAuth.getCurrentUser();

        progressDialog = new ProgressDialog(this);



        

        createNewAccount.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intern = new Intent(MainActivity.this,RegisterUsers.class);
                MainActivity.this.startActivity(intern);
            }
        });
        
        login.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                performLogin(v);
            }
        });

        google.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                performGoogleAuth(v);
            }
        });


    }

    private void performGoogleAuth(View v) {

        GoogleSignInOptions gso = new  GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(getString(R.string.default_web_client_id))
                .requestEmail().build();
        mGoogleSignInClient = GoogleSignIn.getClient(this,gso);

        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        startActivityForResult(signInIntent,RC_SIGN_IN);

    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Result returned from launching the Intent from GoogleSignInApi.getSignInIntent(...);
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                // Google Sign In was successful, authenticate with Firebase
                GoogleSignInAccount account = task.getResult(ApiException.class);
                Log.d(TAG, "firebaseAuthWithGoogle:" + account.getId());
                firebaseAuthWithGoogle(account.getIdToken());
            } catch (ApiException e) {
                // Google Sign In failed, update UI appropriately
                Log.w(TAG, "Google sign in failed", e);
            }
        }
    }
    private void firebaseAuthWithGoogle(String idToken) {
        AuthCredential credential = GoogleAuthProvider.getCredential(idToken, null);
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(this, new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        if (task.isSuccessful()) {
                            // Sign in success, update UI with the signed-in user's information
                            Log.d(TAG, "signInWithCredential:success");
                            FirebaseUser user = mAuth.getCurrentUser();
                            updateUI(user);
                        } else {
                            // If sign in fails, display a message to the user.
                            Log.w(TAG, "signInWithCredential:failure", task.getException());
                            updateUI(null);
                        }
                    }
                });
    }

    private void updateUI(FirebaseUser user) {
        sendUserToNextActivity();
    }

    private void performLogin(View v) {
        email = emailAddress.getText().toString();
        password = passwordtxt.getText().toString();

        if(validateData())
        {

            progressDialog.setMessage("Please wiat ...");
            progressDialog.setTitle("Login");
            progressDialog.setCanceledOnTouchOutside(false);
            progressDialog.show();

            mAuth.signInWithEmailAndPassword(email,password).addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                @Override
                public void onComplete(@NonNull Task<AuthResult> task) {
                    if(task.isSuccessful())
                    {
                        Toast.makeText(MainActivity.this,"User has been logged in Successfully",Toast.LENGTH_LONG).show();
                        progressDialog.dismiss();
                        sendUserToNextActivity();

                    }
                    else
                    {
                        progressDialog.dismiss();
                        Toast.makeText(MainActivity.this,task.getException().toString(),Toast.LENGTH_LONG).show();

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

    public boolean validateData()
    {
        if(email.isEmpty())
        {
            emailAddress.setError("Please Enter the email Address");
            return false;
        }
        if(!Patterns.EMAIL_ADDRESS.matcher(email).matches())
        {
            emailAddress.setError("Please Enter valid email address!..");
            return false;
        }
        if(password.isEmpty())
        {
            passwordtxt.setError("Please Enter thr password!..");
            return false;
        }
        if(password.toCharArray().length < 6)
        {
            passwordtxt.setError("minimum password length 6 characters !");
            return false;
        }
        return true;
    }

    public void onStart() {
        super.onStart();
        // Check if user is signed in (non-null) and update UI accordingly.
        FirebaseUser currentUser = mAuth.getCurrentUser();

    }
}