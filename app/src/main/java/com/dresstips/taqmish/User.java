package com.dresstips.taqmish;

public class User {
    public String email, password, fullName;
    public String firstName, lastName, country, gender;
    public String age, height, weight, bodyShape;
    public String profileImageUrl;
    public boolean profileComplete;

    public User() {
        this.profileComplete = false;
    }

    public User(String email, String password, String fullName) {
        this.fullName = fullName;
        this.password = password;
        this.email = email;
        this.profileComplete = false;
    }

    public boolean isProfileComplete() {
        return profileComplete;
    }

    public void setProfileComplete(boolean complete) {
        this.profileComplete = complete;
    }
}
