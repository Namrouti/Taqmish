package com.dresstips.taqmish;

import android.graphics.Bitmap;

import java.util.Date;
import java.util.UUID;

public class ClassType {
    String arabicName,englishName,imageUrl;
    Date entryDate;
    String uuid;
    public  ClassType()
    {

    }

    public ClassType(String arabicName, String englishName, String imageUrl, Date entryDate,String uuid) {
        this.arabicName = arabicName;
        this.englishName = englishName;
        this.imageUrl = imageUrl;
        this.entryDate = entryDate;
        this.uuid = uuid;
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
}
