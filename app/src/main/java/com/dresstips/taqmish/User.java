package com.dresstips.taqmish;

public class User {
    public String email, password, fullName;
    public  User()
    {

    }
    public User(String email,String password, String fullName)
    {
        this.fullName = fullName;
        this.password = password;
        this.email= email;
    }
}
