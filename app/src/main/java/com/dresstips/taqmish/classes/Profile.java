package com.dresstips.taqmish.classes;

import java.util.HashMap;

public class Profile {
    int tall, wieght, age, day, month, year;
    String sex, countryName, countryCode;

    public Profile()
    {

    }

    public Profile(int tall, int wieght, int age, int day, int month, int year, String sex, String countryName, String countryCode) {
        this.tall = tall;
        this.wieght = wieght;
        this.age = age;
        this.day = day;
        this.month = month;
        this.year = year;
        this.sex = sex;
        this.countryName = countryName;
        this.countryCode = countryCode;
    }

    public int getTall() {
        return tall;
    }

    public void setTall(int tall) {
        this.tall = tall;
    }

    public int getWieght() {
        return wieght;
    }

    public void setWieght(int wieght) {
        this.wieght = wieght;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public int getDay() {
        return day;
    }

    public void setDay(int day) {
        this.day = day;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public String getCountryName() {
        return countryName;
    }

    public void setCountryName(String countryName) {
        this.countryName = countryName;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }
    public HashMap<String, Object> toMap()
    {
        HashMap<String, Object> map = new HashMap<>();
        map.put("tall",tall);
        map.put("wieght",wieght);
        map.put("age",age);
        map.put("day",day);
        map.put("month", month);
        map.put("year", year);
        map.put("countryName", countryName);
        map.put("countryCode", countryCode);

        return map;
    }
}
