package com.dresstips.taqmish.classes;

import android.graphics.Bitmap;
import android.graphics.Color;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class WardrobeImageHelper {
    private WardrobeImageHelper() {
    }

    public static Bitmap removeLightBackground(Bitmap source) {
        if (source == null) {
            return null;
        }

        Bitmap scaled = scaleBitmap(source, 900);
        Bitmap output = scaled.copy(Bitmap.Config.ARGB_8888, true);

        int width = output.getWidth();
        int height = output.getHeight();
        int sampleSize = Math.max(1, Math.min(width, height) / 12);
        int threshold = estimateBackgroundThreshold(output, sampleSize);

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int pixel = output.getPixel(x, y);
                int alpha = Color.alpha(pixel);
                if (alpha == 0) {
                    continue;
                }

                int brightness = (Color.red(pixel) + Color.green(pixel) + Color.blue(pixel)) / 3;
                int maxChannelGap = Math.max(
                        Math.abs(Color.red(pixel) - Color.green(pixel)),
                        Math.max(
                                Math.abs(Color.red(pixel) - Color.blue(pixel)),
                                Math.abs(Color.green(pixel) - Color.blue(pixel))));

                boolean isBackgroundLike = brightness >= threshold && maxChannelGap < 28;
                if (isBackgroundLike) {
                    output.setPixel(x, y, Color.argb(0, Color.red(pixel), Color.green(pixel), Color.blue(pixel)));
                }
            }
        }

        return output;
    }

    public static ArrayList<String> extractDominantColors(Bitmap bitmap, int maxColors) {
        ArrayList<String> dominantColors = new ArrayList<>();
        if (bitmap == null) {
            return dominantColors;
        }

        Bitmap scaled = scaleBitmap(bitmap, 120);
        Map<String, Integer> buckets = new LinkedHashMap<>();

        for (int y = 0; y < scaled.getHeight(); y++) {
            for (int x = 0; x < scaled.getWidth(); x++) {
                int pixel = scaled.getPixel(x, y);
                if (Color.alpha(pixel) < 40) {
                    continue;
                }

                int red = quantize(Color.red(pixel));
                int green = quantize(Color.green(pixel));
                int blue = quantize(Color.blue(pixel));
                String hex = String.format(Locale.US, "#%02X%02X%02X", red, green, blue);
                buckets.put(hex, buckets.containsKey(hex) ? buckets.get(hex) + 1 : 1);
            }
        }

        List<Map.Entry<String, Integer>> sorted = new ArrayList<>(buckets.entrySet());
        sorted.sort((left, right) -> Integer.compare(right.getValue(), left.getValue()));

        for (Map.Entry<String, Integer> entry : sorted) {
            boolean distinctEnough = true;
            for (String selected : dominantColors) {
                if (ColorHelper.isInColorRange(selected, entry.getKey(), 36)) {
                    distinctEnough = false;
                    break;
                }
            }

            if (distinctEnough) {
                dominantColors.add(entry.getKey());
            }

            if (dominantColors.size() >= maxColors) {
                break;
            }
        }

        return dominantColors;
    }

    private static Bitmap scaleBitmap(Bitmap source, int maxSide) {
        int width = source.getWidth();
        int height = source.getHeight();
        int largestSide = Math.max(width, height);
        if (largestSide <= maxSide) {
            return source.copy(Bitmap.Config.ARGB_8888, true);
        }

        float ratio = (float) maxSide / (float) largestSide;
        int targetWidth = Math.max(1, Math.round(width * ratio));
        int targetHeight = Math.max(1, Math.round(height * ratio));
        return Bitmap.createScaledBitmap(source, targetWidth, targetHeight, true);
    }

    private static int estimateBackgroundThreshold(Bitmap bitmap, int sampleSize) {
        long brightnessSum = 0;
        int samples = 0;

        for (int x = 0; x < bitmap.getWidth(); x += sampleSize) {
            brightnessSum += brightness(bitmap.getPixel(x, 0));
            brightnessSum += brightness(bitmap.getPixel(x, bitmap.getHeight() - 1));
            samples += 2;
        }

        for (int y = 0; y < bitmap.getHeight(); y += sampleSize) {
            brightnessSum += brightness(bitmap.getPixel(0, y));
            brightnessSum += brightness(bitmap.getPixel(bitmap.getWidth() - 1, y));
            samples += 2;
        }

        if (samples == 0) {
            return 230;
        }

        int average = (int) (brightnessSum / samples);
        return Math.max(205, average - 10);
    }

    private static int brightness(int color) {
        return (Color.red(color) + Color.green(color) + Color.blue(color)) / 3;
    }

    private static int quantize(int value) {
        int bucketSize = 32;
        int quantized = (value / bucketSize) * bucketSize;
        return Math.min(255, quantized);
    }
}
