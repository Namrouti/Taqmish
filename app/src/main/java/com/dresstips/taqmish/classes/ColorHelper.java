package com.dresstips.taqmish.classes;

import android.graphics.Color;

import java.util.List;


public class ColorHelper {
    public static int getComplementaryColor(String hexColor) {
        int color = Color.parseColor(hexColor);
        // get existing colors
        int r = Color.red(color);
        int g = Color.green(color);
        int b = Color.blue(color);
        // find compliments
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
        return Color.rgb(r, g, b);
    }
    public static boolean isComplementaryColor(String hexColor, int range) {
        int color = Color.parseColor(hexColor);
        int r = Color.red(color);
        int g = Color.green(color);
        int b = Color.blue(color);
        int compliment = Color.rgb(255 - r, 255 - g, 255 - b);
        int delta = (int) Math.sqrt((Math.pow((Color.red(compliment) - r), 2) +
                Math.pow((Color.green(compliment) - g), 2) +
                Math.pow((Color.blue(compliment) - b), 2)));
        return delta <= range;
    }
    public static boolean isWithinComplementaryRange(String hexColor1, String hexColor2, int range) {
        int color1 = Color.parseColor(hexColor1);
        int color2 = Color.parseColor(hexColor2);
        int r1 = Color.red(color1);
        int g1 = Color.green(color1);
        int b1 = Color.blue(color1);
        int r2 = Color.red(color2);
        int g2 = Color.green(color2);
        int b2 = Color.blue(color2);
        int compliment = Color.rgb(255 - r2, 255 - g2, 255 - b2);
        int delta = (int) Math.sqrt((Math.pow((Color.red(compliment) - r1), 2) +
                Math.pow((Color.green(compliment) - g1), 2) +
                Math.pow((Color.blue(compliment) - b1), 2)));
        return delta <= range;
    }
    public static boolean isInColorRange(int color1, int color2, int range) {
        int r1 = Color.red(color1);
        int g1 = Color.green(color1);
        int b1 = Color.blue(color1);
        int r2 = Color.red(color2);
        int g2 = Color.green(color2);
        int b2 = Color.blue(color2);
        int diff = (int) Math.sqrt((r1 - r2) * (r1 - r2) + (g1 - g2) * (g1 - g2) + (b1 - b2) * (b1 - b2));
        return diff <= range;
    }

    public static boolean isInColorRange(String color1, String color2, int range) {
        int c1 = Color.parseColor(color1);
        int c2 = Color.parseColor(color2);
        int r1 = Color.red(c1);
        int g1 = Color.green(c1);
        int b1 = Color.blue(c1);
        int r2 = Color.red(c2);
        int g2 = Color.green(c2);
        int b2 = Color.blue(c2);
        int diff = (int) Math.sqrt((r1 - r2) * (r1 - r2) + (g1 - g2) * (g1 - g2) + (b1 - b2) * (b1 - b2));
        return diff <= range;
    }
    public static boolean isTowClosetsCompatable(SiteClosets sc1, SiteClosets sc2, int range)
    {
        List<String> cl1 = sc1.getColors();
        List<String> cl2 = sc2.getColors();
        for(int i=0; i <= sc1.getColors().size() - 1; i ++)
        {
            for(int j = 0 ; j <= sc2.getColors().size() -1 ; j ++)
            {

                if(isWithinComplementaryRange(cl1.get(i),cl2.get(j),range) && isInColorRange(cl1.get(i),cl2.get(j),range))
                {
                    return  true;
                }
            }
        }
        return false;
    }
}
