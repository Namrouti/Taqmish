package com.dresstips.taqmish.classes;

import android.net.Uri;

import com.google.android.gms.tasks.OnSuccessListener;

import java.util.HashMap;
import java.util.List;

public class SiteClosets {
    public String id;
    public String bodyPart;
    public String subParts;
    public String filePath;
    public List<String> colors;
    public String mainClass;
    public String age;
    public String sex;
    public String size;


    public  SiteClosets()
    {

    }

    public SiteClosets(String id,  String bodyPart, String filePath, List<String> colors, String mainClass, String age, String sex, String size) {
        this.id = id;
        this.mainClass = mainClass;
        this.bodyPart = bodyPart;

        this.filePath = filePath;
        this.colors = colors;
        this.age = age;
        this.sex = sex;
        this.size = size;
    }


    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMainClass() {
        return mainClass;
    }

    public void setMainClass(String mainClass) {
        this.mainClass = mainClass;
    }

    public String getBodyPart() {
        return bodyPart;
    }

    public void setBodyPart(String bodyPart) {
        this.bodyPart = bodyPart;
    }

    public String getSubParts() {
        return subParts;
    }

    public void setSubParts(String subParts) {
        this.subParts = subParts;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public List<String> getColors() {
        return colors;
    }

    public void setColors(List<String> colors) {
        this.colors = colors;
    }

    public String getAge() {
        return age;
    }

    public void setAge(String age) {
        this.age = age;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public String getSize() {
        return size;
    }


    public void setSize(String size) {
        this.size = size;
    }

    public HashMap<String, Object> toMap()
    {
        HashMap<String, Object> map = new HashMap<>();
        map.put("Id",id);
        map.put("BodyPart",bodyPart);
        map.put("MainClass",mainClass);
        map.put("filePath",filePath);
        map.put("sex",sex);
        map.put("age",age);
        map.put("size",size);
        map.put("colors",colors);

        return map;
    }
}
