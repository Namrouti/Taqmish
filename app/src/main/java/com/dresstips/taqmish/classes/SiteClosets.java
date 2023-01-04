package com.dresstips.taqmish.classes;

import java.util.HashMap;

public class SiteClosets {
    String id;
    String groupName;
    String mainClass;
    String bodyPart;
    String subGroup;

    public  SiteClosets()
    {

    }

    public SiteClosets(String id, String groupName, String mainClass, String bodyPart, String subGroup) {
        this.id = id;
        this.groupName = groupName;
        this.mainClass = mainClass;
        this.bodyPart = bodyPart;
        this.subGroup = subGroup;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
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

    public String getSubGroup() {
        return subGroup;
    }

    public void setSubGroup(String subGroup) {
        this.subGroup = subGroup;
    }

    public HashMap<String, Object> toMap()
    {
        HashMap<String, Object> map = new HashMap<>();
        map.put("Id",id);
        map.put("BodyPart",bodyPart);
        map.put("MainClass",mainClass);
        map.put("subGroup",subGroup);
        map.put("GroupName",groupName);
        return map;
    }
}
