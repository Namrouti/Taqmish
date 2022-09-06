package com.dresstips.taqmish.classes;

import java.util.Date;
import java.util.HashMap;

public class ClassType {
    String arabicName,englishName,imageUrl;
    Date entryDate;
    String uuid;
    String imageName;

    public  ClassType()
    {

    }

    public ClassType(String arabicName, String englishName, String imageUrl, Date entryDate,String uuid, String imageName) {
        this.arabicName = arabicName;
        this.englishName = englishName;
        this.imageUrl = imageUrl;
        this.entryDate = entryDate;
        this.uuid = uuid;
        this.imageName = imageName;
    }

    public String getImageName() {
        return imageName;
    }

    public void setImageName(String imageName) {
        this.imageName = imageName;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getArabicName() {
        return arabicName;
    }

    public void setArabicName(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getEnglishName() {
        return englishName;
    }

    public void setEnglishName(String englishName) {
        this.englishName = englishName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Date getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(Date entryDate) {
        this.entryDate = entryDate;
    }

    public HashMap<String, Object> toMap()
    {
        HashMap<String, Object> map = new HashMap<>();
        map.put("EnglishName",englishName);
        map.put("rabicName",arabicName);
        map.put("imageUrl",imageUrl);
        map.put("entryDate",entryDate);
        return map;
    }
}
