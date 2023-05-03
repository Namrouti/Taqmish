package com.dresstips.taqmish.classes;

public class MainClass {
    String id;
    String arabicName;
    String englishName;
    String filePath;
    String date;

    public  MainClass()
    {

    }

    public MainClass(String id, String arabicName, String englishName, String filePath, String date) {
        this.id = id;
        this.arabicName = arabicName;
        this.englishName = englishName;
        this.filePath = filePath;
        this.date = date;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePate) {
        this.filePath = filePate;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }
}
