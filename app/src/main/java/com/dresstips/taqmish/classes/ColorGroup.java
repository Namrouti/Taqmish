package com.dresstips.taqmish.classes;

import java.util.ArrayList;

public class ColorGroup {
    String groupName;
    String imageUrl;
    String colorGroupKey;
    String imageName;
    ArrayList<String> colors;

    public ColorGroup(String groupName, String imageUrl, String colorGroupKey, String imageName,ArrayList<String> colors) {
        this.groupName = groupName;
        this.imageUrl = imageUrl;
        this.colorGroupKey = colorGroupKey;
        this.imageName = imageName;
        this.colors = colors;
    }

    public ArrayList<String> getColors() {
        return colors;
    }

    public void setColors(ArrayList<String> colors) {
        this.colors = colors;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getColorGroupKey() {
        return colorGroupKey;
    }

    public void setColorGroupKey(String colorGroupKey) {
        this.colorGroupKey = colorGroupKey;
    }

    public String getImageName() {
        return imageName;
    }

    public void setImageName(String imageName) {
        this.imageName = imageName;
    }

    public ColorGroup()
    {
        colors = new ArrayList();
    }


}
