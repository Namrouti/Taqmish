package com.dresstips.taqmish.classes;

public class OutfitClass {

    SiteClosets top;
    SiteClosets down;
    SiteClosets accessories;
    SiteClosets shoes;
    String bodyPart;
    String subParts;
    String mainClass;
    String color;
    String id;

    public OutfitClass(SiteClosets top, SiteClosets down, SiteClosets accessories, SiteClosets shoes, String bodyPart, String subParts, String mainClass, String color, String id) {
        this.top = top;
        this.down = down;
        this.accessories = accessories;
        this.shoes = shoes;
        this.bodyPart = bodyPart;
        this.subParts = subParts;
        this.mainClass = mainClass;
        this.color = color;
        this.id = id;

    }

    public OutfitClass()
    {

    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getMainClass() {
        return mainClass;
    }

    public void setMainClass(String mainClass) {
        this.mainClass = mainClass;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public SiteClosets getTop() {
        return top;
    }

    public void setTop(SiteClosets top) {
        this.top = top;
    }

    public SiteClosets getDown() {
        return down;
    }

    public void setDown(SiteClosets down) {
        this.down = down;
    }

    public SiteClosets getAccessories() {
        return accessories;
    }

    public void setAccessories(SiteClosets accessories) {
        this.accessories = accessories;
    }

    public SiteClosets getShoes() {
        return shoes;
    }

    public void setShoes(SiteClosets shoes) {
        this.shoes = shoes;
    }
}
