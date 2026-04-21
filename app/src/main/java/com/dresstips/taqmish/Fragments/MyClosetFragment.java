package com.dresstips.taqmish.Fragments;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.chip.Chip;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.Adapters.ClosetsAdapter;
import com.dresstips.taqmish.Interfaces.ClosetAdapterHomeFragemntIINterface;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.ADO.ADO;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.SiteClosets;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;

public class MyClosetFragment extends Fragment implements ClosetAdapterHomeFragemntIINterface {

    private static final int CAMERA_REQUEST_CODE = 1002;
    private com.google.android.material.button.MaterialButton capturePieceButton;
    private com.google.android.material.button.MaterialButton saveCapturedButton;
    private Chip filterAllButton;
    private Chip filterTopButton;
    private Chip filterBottomButton;
    private Chip filterShoesButton;
    private Chip filterAccessoriesButton;
    private Chip filterBagButton;
    private ImageView previewImageView;
    private TextView previewStatusText;
    private TextView currentFilterText;
    private TextView savedItemsEmptyText;
    private RecyclerView closetRecyclerView;

    private ClosetsAdapter closetAdapter;
    private final ArrayList<SiteClosets> closetItems = new ArrayList<>();
    private Bitmap currentCapturedBitmap;
    private String currentPredictedType = "غير معروف";
    private ProgressDialog progressDialog;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_my_closet, container, false);

        capturePieceButton = view.findViewById(R.id.capturePieceButton);
        saveCapturedButton = view.findViewById(R.id.saveCapturedButton);
        filterAllButton = view.findViewById(R.id.filterAllButton);
        filterTopButton = view.findViewById(R.id.filterTopButton);
        filterBottomButton = view.findViewById(R.id.filterBottomButton);
        filterShoesButton = view.findViewById(R.id.filterShoesButton);
        filterAccessoriesButton = view.findViewById(R.id.filterAccessoriesButton);
        filterBagButton = view.findViewById(R.id.filterBagButton);
        previewImageView = view.findViewById(R.id.previewImageView);
        previewStatusText = view.findViewById(R.id.previewStatusText);
        currentFilterText = view.findViewById(R.id.currentFilterText);
        savedItemsEmptyText = view.findViewById(R.id.savedItemsEmptyText);
        closetRecyclerView = view.findViewById(R.id.closetRecyclerView);
        progressDialog = new ProgressDialog(getContext());

        setupClosetRecyclerView();
        setupListeners();
        loadSavedClosetItems();

        return view;
    }

    private void setupClosetRecyclerView() {
        closetAdapter = new ClosetsAdapter(closetItems, requireContext(), this);
        closetRecyclerView.setLayoutManager(new GridLayoutManager(getContext(), 2));
        closetRecyclerView.setAdapter(closetAdapter);
    }

    private void setupListeners() {
        capturePieceButton.setOnClickListener(v -> openCamera());
        saveCapturedButton.setOnClickListener(v -> saveCapturedPiece());

        filterAllButton.setOnClickListener(v -> applyFilter("All"));
        filterTopButton.setOnClickListener(v -> applyFilter("Top"));
        filterBottomButton.setOnClickListener(v -> applyFilter("Bottom"));
        filterShoesButton.setOnClickListener(v -> applyFilter("Shoes"));
        filterAccessoriesButton.setOnClickListener(v -> applyFilter("Accessories"));
        filterBagButton.setOnClickListener(v -> applyFilter("Bag"));
    }

    private void openCamera() {
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (intent.resolveActivity(requireActivity().getPackageManager()) != null) {
            startActivityForResult(intent, CAMERA_REQUEST_CODE);
        } else {
            Toast.makeText(getContext(), "لا يوجد تطبيق كاميرا متاح.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == CAMERA_REQUEST_CODE && resultCode == Activity.RESULT_OK && data != null) {
            Bitmap photo = (Bitmap) data.getExtras().get("data");
            if (photo != null) {
                currentCapturedBitmap = removeBackground(photo);
                previewImageView.setImageBitmap(currentCapturedBitmap);
                previewImageView.setVisibility(View.VISIBLE);
                currentPredictedType = classifyItemType(currentCapturedBitmap);
                previewStatusText
                        .setText("تم تصنيف القطعة كـ: " + currentPredictedType + "\nاضغط حفظ لإضافتها إلى الخزانة.");
                saveCapturedButton.setVisibility(View.VISIBLE);
            }
        }
    }

    private Bitmap removeBackground(Bitmap source) {
        Bitmap result = source.copy(Bitmap.Config.ARGB_8888, true);
        int width = result.getWidth();
        int height = result.getHeight();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int pixel = result.getPixel(x, y);
                int red = Color.red(pixel);
                int green = Color.green(pixel);
                int blue = Color.blue(pixel);

                if (red > 220 && green > 220 && blue > 220) {
                    result.setPixel(x, y, Color.TRANSPARENT);
                }
            }
        }
        return result;
    }

    private String classifyItemType(Bitmap bitmap) {
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        float ratio = (float) width / Math.max(1, height);

        if (ratio > 1.2f) {
            return "Top";
        }
        if (ratio < 0.8f) {
            return "Bottom";
        }
        if (ratio > 0.9f && ratio < 1.1f) {
            return "Shoes";
        }
        return "Accessories";
    }

    private void saveCapturedPiece() {
        if (currentCapturedBitmap == null) {
            Toast.makeText(getContext(), "التقط صورة أولا ثم حاول الحفظ.", Toast.LENGTH_SHORT).show();
            return;
        }

        if (ADO.getUserId() == null) {
            Toast.makeText(getContext(), "يرجى تسجيل الدخول أولا.", Toast.LENGTH_SHORT).show();
            return;
        }

        progressDialog.setMessage("جار حفظ القطعة في الخزانة...");
        progressDialog.setCancelable(false);
        progressDialog.show();

        saveBitmapToFirebase(currentCapturedBitmap, currentPredictedType, new SaveCompletion() {
            @Override
            public void onComplete() {
                progressDialog.dismiss();
                Toast.makeText(getContext(), "تم حفظ القطعة بنجاح.", Toast.LENGTH_SHORT).show();
                currentCapturedBitmap = null;
                currentPredictedType = "غير معروف";
                previewImageView.setVisibility(View.GONE);
                saveCapturedButton.setVisibility(View.GONE);
                previewStatusText.setText("لم يتم التقاط صورة بعد");
                loadSavedClosetItems();
            }
        }, new SaveCompletion() {
            @Override
            public void onComplete() {
                progressDialog.dismiss();
                Toast.makeText(getContext(), "فشل حفظ القطعة. حاول مرة أخرى.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void saveBitmapToFirebase(Bitmap bitmap, String type, SaveCompletion success,
            SaveCompletion failure) {
        String uid = ADO.getUserId().getUid();
        DatabaseReference dbRef = General.getDataBaseRefrenece(SiteClosets.class.getSimpleName()).child(uid);
        String id = dbRef.push().getKey();
        if (id == null) {
            failure.onComplete();
            return;
        }

        byte[] bytes = bitmapToPng(bitmap);
        if (bytes == null) {
            failure.onComplete();
            return;
        }

        String extension = "png";
        StorageReference storageRef = General.getStorageRefrence(SiteClosets.class.getSimpleName())
                .child(uid)
                .child(id + "." + extension);

        storageRef.putBytes(bytes)
                .addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
                    @Override
                    public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                        storageRef.getDownloadUrl().addOnSuccessListener(new OnSuccessListener<Uri>() {
                            @Override
                            public void onSuccess(Uri downloadUri) {
                                SiteClosets sc = new SiteClosets();
                                sc.setId(id);
                                sc.setBodyPart(getBodyPartForType(type));
                                sc.setSubParts(type);
                                sc.setFilePath(downloadUri.toString());
                                sc.setColors(new ArrayList<>());
                                sc.setMainClass("Camera");
                                sc.setSex("غير محدد");
                                sc.setAge("غير محدد");
                                sc.setSize("غير محدد");
                                dbRef.child(id).setValue(sc)
                                        .addOnSuccessListener(new OnSuccessListener<Void>() {
                                            @Override
                                            public void onSuccess(Void unused) {
                                                success.onComplete();
                                            }
                                        })
                                        .addOnFailureListener(new OnFailureListener() {
                                            @Override
                                            public void onFailure(@NonNull Exception e) {
                                                failure.onComplete();
                                            }
                                        });
                            }
                        }).addOnFailureListener(new OnFailureListener() {
                            @Override
                            public void onFailure(@NonNull Exception e) {
                                failure.onComplete();
                            }
                        });
                    }
                })
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        failure.onComplete();
                    }
                });
    }

    private byte[] bitmapToPng(Bitmap bitmap) {
        try {
            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
            return stream.toByteArray();
        } catch (Exception e) {
            return null;
        }
    }

    private String getBodyPartForType(String type) {
        if ("Top".equalsIgnoreCase(type)) {
            return "الجزء العلوي";
        }
        if ("Bottom".equalsIgnoreCase(type)) {
            return "الجزء السفلي";
        }
        if ("Shoes".equalsIgnoreCase(type)) {
            return "اكسسوارات";
        }
        if ("Bag".equalsIgnoreCase(type)) {
            return "اكسسوارات";
        }
        return "اكسسوارات";
    }

    private void applyFilter(String type) {
        currentFilterText.setText("عرض: " + getFilterLabel(type));
        closetAdapter.filterByType(type);
        savedItemsEmptyText.setVisibility(closetAdapter.getItemCount() == 0 ? View.VISIBLE : View.GONE);
    }

    private String getFilterLabel(String type) {
        switch (type) {
            case "Top":
                return "أعلى";
            case "Bottom":
                return "أسفل";
            case "Shoes":
                return "أحذية";
            case "Accessories":
                return "إكسسوارات";
            case "Bag":
                return "حقائب";
            default:
                return "الكل";
        }
    }

    private void loadSavedClosetItems() {
        if (ADO.getUserId() == null) {
            savedItemsEmptyText.setText("يرجى تسجيل الدخول لرؤية الخزانة.");
            savedItemsEmptyText.setVisibility(View.VISIBLE);
            return;
        }

        DatabaseReference dbRef = General.getDataBaseRefrenece(SiteClosets.class.getSimpleName())
                .child(ADO.getUserId().getUid());
        dbRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                closetItems.clear();
                for (DataSnapshot child : snapshot.getChildren()) {
                    SiteClosets sc = child.getValue(SiteClosets.class);
                    if (sc != null) {
                        closetItems.add(sc);
                    }
                }
                closetAdapter.setData(closetItems);
                closetAdapter.notifyDataSetChanged();
                savedItemsEmptyText.setVisibility(closetItems.isEmpty() ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Toast.makeText(getContext(), "فشل تحميل عناصر الخزانة.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void itemClicked(SiteClosets item, ImageView imageView) {
        Toast.makeText(getContext(), "تم اختيار: " + item.getSubParts(), Toast.LENGTH_SHORT).show();
    }

    private interface SaveCompletion {
        void onComplete();
    }
}
