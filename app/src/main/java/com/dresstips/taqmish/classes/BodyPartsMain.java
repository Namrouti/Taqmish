package com.dresstips.taqmish.classes;

import java.util.HashMap;
import java.util.List;

public class BodyPartsMain {
    String id;
    String arabicName;
    String englishName;
    String filePath;
    List<Config> subParts;
    List<String> subPartsFilePath;
    List<String> subPartsFile;

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

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public List<Config> getSubParts() {
        return subParts;
    }

    public void setSubParts(List<Config> subParts) {
        this.subParts = subParts;
    }

    public List<String> getSubPartsFilePath() {
        return subPartsFilePath;
    }

    public void setSubPartsFilePath(List<String> subPartsFilePath) {
        this.subPartsFilePath = subPartsFilePath;
    }

    public List<String> getSubPartsFile() {
        return subPartsFile;
    }

    public void setSubPartsFile(List<String> subPartsFile) {
        this.subPartsFile = subPartsFile;
    }
    public HashMap<String, Object> toMap()
    {
        HashMap<String, Object> map = new HashMap<>();
        map.put("Id",id);
        map.put("ArabicName",arabicName);
        map.put("EnglishName",englishName);
        map.put("FilePath",filePath);
        map.put("SubParts",subParts);
        map.put("SubPartsFile",subPartsFile);
        map.put("subPartsFilePath",subPartsFilePath);

        return map;
    }
}
