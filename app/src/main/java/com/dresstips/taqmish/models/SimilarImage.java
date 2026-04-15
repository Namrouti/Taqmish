package com.dresstips.taqmish.models;

import android.net.Uri;

public class SimilarImage {
    private String imageResId;
    private String gender;
    private String season;
    private boolean isSelected;
    private String url ;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public SimilarImage(String imageResId, String gender, String season) {
        this.imageResId = imageResId;
        this.gender = gender;
        this.season = season;
        this.isSelected = false;
    }
    public SimilarImage()
    {

    }

    public String getImageResId() {
        return imageResId;
    }

    public void setImageResId(String imageResId) {
        this.imageResId = imageResId;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public boolean isSelected() {
        return isSelected;
    }

    public void setSelected(boolean selected) {
        isSelected = selected;
    }
}