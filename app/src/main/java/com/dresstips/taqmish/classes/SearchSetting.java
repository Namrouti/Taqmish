package com.dresstips.taqmish.classes;

import java.util.HashMap;

public class SearchSetting {
    String gender,countryName,countryCoude,CountryNameCoude;

    HashMap<String,String> mainClass,size,bodyParts, subParts;

    public SearchSetting(){
        mainClass = new HashMap<>();
        size = new HashMap<>();
        bodyParts = new HashMap<>();
        subParts = new HashMap<>();
    }

    public SearchSetting(String gender, String countryName, String countryCoude, String countryNameCoude, HashMap<String, String> mainClass, HashMap<String, String> size, HashMap<String, String> bodyParts, HashMap<String, String> subParts) {
        this.gender = gender;
        this.countryName = countryName;
        this.countryCoude = countryCoude;
        CountryNameCoude = countryNameCoude;
        this.mainClass = mainClass;
        this.size = size;
        this.bodyParts = bodyParts;
        this.subParts = subParts;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getCountryName() {
        return countryName;
    }

    public void setCountryName(String countryName) {
        this.countryName = countryName;
    }

    public String getCountryCoude() {
        return countryCoude;
    }

    public void setCountryCoude(String countryCoude) {
        this.countryCoude = countryCoude;
    }

    public String getCountryNameCoude() {
        return CountryNameCoude;
    }

    public void setCountryNameCoude(String countryNameCoude) {
        CountryNameCoude = countryNameCoude;
    }

    public HashMap<String, String> getMainClass() {
        return mainClass;
    }

    public void setMainClass(HashMap<String, String> mainClass) {
        this.mainClass = mainClass;
    }

    public HashMap<String, String> getSize() {
        return size;
    }

    public void setSize(HashMap<String, String> size) {
        this.size = size;
    }

    public HashMap<String, String> getBodyParts() {
        return bodyParts;
    }

    public void setBodyParts(HashMap<String, String> bodyParts) {
        this.bodyParts = bodyParts;
    }

    public HashMap<String, String> getSubParts() {
        return subParts;
    }

    public void setSubParts(HashMap<String, String> subParts) {
        this.subParts = subParts;
    }
}
