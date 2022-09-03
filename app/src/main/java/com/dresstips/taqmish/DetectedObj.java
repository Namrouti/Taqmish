package com.dresstips.taqmish;

public class DetectedObj {

    private String ObjClass;
    private String ImageUrl;
    private String ObjDisc;

    public DetectedObj() {
    }

    public DetectedObj(String objClass, String imageUrl, String objDisc) {
        ObjClass = objClass;
        ImageUrl = imageUrl;
        ObjDisc = objDisc;
    }

    public String getObjClass() {
        return ObjClass;
    }

    public void setObjClass(String objClass) {
        ObjClass = objClass;
    }

    public String getImageUrl() {
        return ImageUrl;
    }

    public void setImageUrl(String imageUrl) {
        ImageUrl = imageUrl;
    }

    public String getObjDisc() {
        return ObjDisc;
    }

    public void setObjDisc(String objDisc) {
        ObjDisc = objDisc;
    }
}
