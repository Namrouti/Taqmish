package com.dresstips.taqmish.classes;

public class CalendarItem {
    String itemID, time,date, month , year, outfitID, day;
    public CalendarItem()
    {

    }

    public CalendarItem(String itemID, String time, String date, String month, String year, String outfitID, String day) {
        this.itemID = itemID;
        this.time = time;
        this.date = date;
        this.month = month;
        this.year = year;
        this.outfitID = outfitID;
        this.day = day;
    }

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public String getItemID() {
        return itemID;
    }

    public void setItemID(String itemID) {
        this.itemID = itemID;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getOutfitID() {
        return outfitID;
    }

    public void setOutfitID(String outfitID) {
        this.outfitID = outfitID;
    }
}
