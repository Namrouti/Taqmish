package com.dresstips.taqmish.models;

public class SimilarImage {
    private int imageResId;
    private String gender;
    private String season;
    private boolean isSelected;

    public SimilarImage(int imageResId, String gender, String season) {
        this.imageResId = imageResId;
        this.gender = gender;
        this.season = season;
        this.isSelected = false;
    }

    public int getImageResId() {
        return imageResId;
    }

    public void setImageResId(int imageResId) {
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