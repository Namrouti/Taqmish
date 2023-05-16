package com.dresstips.taqmish.classes;

import java.util.HashMap;

public class SearchSetting {
    String gender,countryName,countryCoude,CountryNameCoude;

    HashMap<String,String> mainClass,size,subClass;

    public SearchSetting(){
        mainClass = new HashMap<>();
        size = new HashMap<>();
        subClass = new HashMap<>();
    }

    public SearchSetting(String gender, String countryName, String countryCoude, String countryNameCoude, HashMap<String, String> mainClass, HashMap<String, String> size, HashMap<String, String> subClass) {
        this.gender = gender;
        this.countryName = countryName;
        this.countryCoude = countryCoude;
        CountryNameCoude = countryNameCoude;
        this.mainClass = mainClass;
        this.size = size;
        this.subClass = subClass;
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

    public HashMap<String, String> getSubClass() {
        return subClass;
    }

    public void setSubClass(HashMap<String, String> subClass) {
        this.subClass = subClass;
    }
}
