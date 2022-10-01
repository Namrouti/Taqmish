package com.dresstips.taqmish.classes;

public class ColorGroup {
    String groupName;
    String imageUrl;
    String colorGroupKey;
    String imageName;

    public ColorGroup(String groupName, String imageUrl, String colorGroupKey, String imageName) {
        this.groupName = groupName;
        this.imageUrl = imageUrl;
        this.colorGroupKey = colorGroupKey;
        this.imageName = imageName;
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

    }


}
