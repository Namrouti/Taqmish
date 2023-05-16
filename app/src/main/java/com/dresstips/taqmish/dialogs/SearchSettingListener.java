package com.dresstips.taqmish.dialogs;

import com.dresstips.taqmish.classes.SearchSetting;

public interface SearchSettingListener {
    void onDialogPositiveClick(SearchSetting result);
    void onDialogNegativeClick();
}
