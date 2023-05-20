package com.dresstips.taqmish.classes;

import java.util.HashMap;

public class Profile {
    int height, weight;
    String sex, countryName, countryCode, countryNameCode, skinColor, firstName, lastName, birthDate;

    public Profile()
    {

    }

    public Profile(int height, int weight, String sex, String countryName, String countryCode, String countryNameCode, String skinColor, String firstName, String lastName, String birthDate) {
        this.height = height;
        this.weight = weight;
        this.sex = sex;
        this.countryName = countryName;
        this.countryCode = countryCode;
        this.countryNameCode = countryNameCode;
        this.skinColor = skinColor;
        this.firstName = firstName;
        this.lastName = lastName;
        this.birthDate = birthDate;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getWeight() {
        return weight;
    }

    public void setWeight(int weight) {
        this.weight = weight;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public String getCountryName() {
        return countryName;
    }

    public void setCountryName(String countryName) {
        this.countryName = countryName;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getCountryNameCode() {
        return countryNameCode;
    }

    public void setCountryNameCode(String countryNameCode) {
        this.countryNameCode = countryNameCode;
    }

    public String getSkinColor() {
        return skinColor;
    }

    public void setSkinColor(String skinColor) {
        this.skinColor = skinColor;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(String birthDate) {
        this.birthDate = birthDate;
    }

    public HashMap<String, Object> toMap()
    {
        HashMap<String, Object> map = new HashMap<>();
        map.put("height",height);
        map.put("weight",weight);
        map.put("countryName", countryName);
        map.put("countryCode", countryCode);
        map.put("countryCodeName",countryNameCode);
        map.put("firstName",firstName);
        map.put("lastName", lastName);
        map.put("skinColor", skinColor);
        map.put("birthDate",birthDate);
        map.put("sex",sex);

        return map;
    }
}
