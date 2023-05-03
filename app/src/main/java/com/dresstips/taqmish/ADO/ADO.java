package com.dresstips.taqmish.ADO;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class ADO {
    public static  FirebaseUser getUserId()
    {
        FirebaseUser mUser = FirebaseAuth.getInstance().getCurrentUser();

        return mUser;
    }
}
