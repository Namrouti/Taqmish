package com.dresstips.taqmish.classes;

import java.util.HashMap;

public class ClassSubType {
    String arabicName;
    String englishName;
    String key;
    String imageUrl;
    String imageKey;
    String rootKey;
    String imageName;


    public ClassSubType(String arabicName, String englishName,
                        String key, String imageUrl, String imageKey, String rootKey, String imageName) {
        this.arabicName = arabicName;
        this.englishName = englishName;
        this.key = key;
        this.imageUrl = imageUrl;
        this.imageKey = imageKey;
        this.rootKey = rootKey;
        this.imageName = imageName;
    }
    public ClassSubType()
    {

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

    public String getImageKey() {
        return imageKey;
    }

    public void setImageKey(String imageKey) {
        this.imageKey = imageKey;
    }

    public String getRootKey() {
        return rootKey;
    }

    public void setRootKey(String rootKey) {
        this.rootKey = rootKey;
    }

    public String getImageName() {
        return imageName;
    }

    public void setImageName(String imageName) {
        this.imageName = imageName;
    }

    public HashMap<String,Object> toMap()
    {
        HashMap<String,Object> map = new HashMap<>();
        map.put("arabicName", arabicName);
        map.put("englishName",englishName);
        map.put("key",key);
        map.put("imageUrl",imageUrl);
        map.put("imageKey",imageKey);
        map.put("rootKey", rootKey);

        return map;
    }
}
