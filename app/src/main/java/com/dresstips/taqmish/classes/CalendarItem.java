package com.dresstips.taqmish.classes;

public class CalendarItem {
    String item, time,date, month , year;
    public CalendarItem()
    {

    }

    public CalendarItem(String item, String time, String date, String month, String year) {
        this.item = item;
        this.time = time;
        this.date = date;
        this.month = month;
        this.year = year;
    }

    public String getItem() {
        return item;
    }

    public void setItem(String item) {
        this.item = item;
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
}
