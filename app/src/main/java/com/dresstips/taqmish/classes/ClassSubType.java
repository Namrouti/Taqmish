package com.dresstips.taqmish.classes;

import java.util.HashMap;

public class ClassSubType {
    String arabicName;
    String EnglishName;
    String key;
    String imageUrl;
    String imageKey;

    public ClassSubType()
    {

    }

    public ClassSubType(String arabicName, String englishName, String key, String imageUrl, String imageKey) {
        this.arabicName = arabicName;
        EnglishName = englishName;
        this.key = key;
        this.imageUrl = imageUrl;
        this.imageKey = imageKey;
    }

    public String getImageKey() {
        return imageKey;
    }

    public void setImageKey(String imageKey) {
        this.imageKey = imageKey;
    }

    public String getArabicName() {
        return arabicName;
    }

    public void setArabicName(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getEnglishName() {
        return EnglishName;
    }

    public void setEnglishName(String englishName) {
        EnglishName = englishName;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public HashMap<String,Object> toMap()
    {
        HashMap<String,Object> map = new HashMap<>();
        map.put("arabicName", arabicName);
        map.put("englishName",EnglishName);
        map.put("key",key);
        map.put("imageUrl",imageUrl);
        map.put("imageKey",imageKey);

        return map;
    }
}
