package com.dresstips.taqmish.models;

import com.dresstips.taqmish.enums.items.ItemCategory;
import com.dresstips.taqmish.enums.items.ItemStatus;
import com.dresstips.taqmish.enums.items.ItemType;

public class Item {
    String id;
    String titel;
    String AddDate;
    ItemType type;
    ItemCategory category;
    ItemStatus status;
    String filePath;
    String imageId;
    String ItemKey;
    public Item() {
    }

    public Item(String id, String filePath, ItemCategory category, ItemType type, String addDate, String titel) {
        this.id = id;
        this.filePath = filePath;
        this.category = category;
        this.type = type;
        AddDate = addDate;
        this.titel = titel;
    }

    public String getItemKey() {
        return ItemKey;
    }

    public void setItemKey(String itemKey) {
        ItemKey = itemKey;
    }

    public String getImageId() {
        return imageId;
    }

    public void setImageId(String imageId) {
        this.imageId = imageId;
    }

    public String getImageName() {
        return ImageName;
    }

    public void setImageName(String imageName) {
        ImageName = imageName;
    }

    String ImageName;



    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFilePath() {
        return filePath;
    }

    public ItemStatus getStatus() {
        return status;
    }

    public void setStatus(ItemStatus status) {
        this.status = status;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public ItemCategory getCategory() {
        return category;
    }

    public void setCategory(ItemCategory category) {
        this.category = category;
    }

    public ItemType getType() {
        return type;
    }

    public void setType(ItemType type) {
        this.type = type;
    }

    public String getAddDate() {
        return AddDate;
    }

    public void setAddDate(String addDate) {
        AddDate = addDate;
    }

    public String getTitel() {
        return titel;
    }

    public void setTitel(String titel) {
        this.titel = titel;
    }
}
