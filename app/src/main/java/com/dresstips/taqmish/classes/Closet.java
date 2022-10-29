package com.dresstips.taqmish.classes;

import java.util.ArrayList;

public class Closet {
    String closetType, mainClass, subClass, closetKey, imageKey;
    ArrayList<String> colors;

    public Closet() {
        colors = new ArrayList();
    }

    public Closet(String closetType, String mainClass, String subClass, String closetKey, String imageKey, ArrayList<String> colors) {
        this.closetType = closetType;
        this.mainClass = mainClass;
        this.subClass = subClass;
        this.closetKey = closetKey;
        this.imageKey = imageKey;
        this.colors = colors;
    }

    public String getClosetType() {
        return closetType;
    }

    public void setClosetType(String closetType) {
        this.closetType = closetType;
    }

    public String getMainClass() {
        return mainClass;
    }

    public void setMainClass(String mainClass) {
        this.mainClass = mainClass;
    }

    public String getSubClass() {
        return subClass;
    }

    public void setSubClass(String subClass) {
        this.subClass = subClass;
    }

    public String getClosetKey() {
        return closetKey;
    }

    public void setClosetKey(String closetKey) {
        this.closetKey = closetKey;
    }

    public String getImageKey() {
        return imageKey;
    }

    public void setImageKey(String imageKey) {
        this.imageKey = imageKey;
    }

    public ArrayList<String> getColors() {
        return colors;
    }

    public void setColors(ArrayList<String> colors) {
        this.colors = colors;
    }
}
