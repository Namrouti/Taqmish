package com.dresstips.taqmish.classes;

import android.content.ContentResolver;
import android.content.Context;
import android.net.Uri;
import android.webkit.MimeTypeMap;

public class General {

    public static String getExtention(Uri uri, Context context)
    {
        MimeTypeMap mim = MimeTypeMap.getSingleton();
        return  mim.getExtensionFromMimeType(context.getContentResolver().getType(uri));
    }
}
