package com.dresstips.taqmish.dialogs;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.BodyPartsMain;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.MainClass;
import com.dresstips.taqmish.classes.SearchSetting;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;

import java.lang.reflect.Array;

public class SearchSettingDialog extends DialogFragment {
    View view;
    SearchSettingListener listener;
    SearchSetting result;
    RadioGroup genderRadioGroup,bodyPartsRadioGroup;
    LinearLayout sizeLinearLayout, class_layout,bodyParts_layout,subParts_layout;

    public SearchSettingDialog(SearchSettingListener listener)
    {
        this.listener = listener;
    }



    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        result = new SearchSetting();
        bodyPartsRadioGroup = new RadioGroup(getContext());
        bodyPartsRadioGroup.setOrientation(RadioGroup.HORIZONTAL);
        view = getActivity().getLayoutInflater().inflate(R.layout.fragment_search_setting,null);
        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
        builder.setTitle("Choose filter factors");
        builder.setView(view).setPositiveButton("OK", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                listener.onDialogPositiveClick(result);

            }
        }).setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                listener.onDialogNegativeClick();
            }
        });

        genderRadioGroup = view.findViewById(R.id.genderRadioGroup);
        sizeLinearLayout = view.findViewById(R.id.sizeLinearLayout);
        class_layout = view.findViewById(R.id.class_layout);
        bodyParts_layout = view.findViewById(R.id.bodyParts_layout);
        subParts_layout = view.findViewById(R.id.subParts_layout);

        General.getDataBaseRefrenece(MainClass.class.getSimpleName()).get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                for(DataSnapshot d : dataSnapshot.getChildren())
                {
                    MainClass mc = d.getValue(MainClass.class);
                    CheckBox ch = new CheckBox(getContext());
                    ch.setText(mc.getEnglishName());
                    ch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
                        @Override
                        public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                            if(isChecked)
                            {
                                result.getMainClass().put(buttonView.getText().toString(),buttonView.getText().toString());
                            }
                            else {
                                result.getMainClass().remove(buttonView.getText().toString());
                            }
                        }
                    });
                    class_layout.addView(ch);
                }

            }
        });
        General.getDataBaseRefrenece(BodyPartsMain.class.getSimpleName()).get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
            @Override
            public void onSuccess(DataSnapshot dataSnapshot) {
                for(DataSnapshot d : dataSnapshot.getChildren())
                {
                    BodyPartsMain bpm = d.getValue(BodyPartsMain.class);
                    RadioButton rb = new RadioButton(getContext());
                    rb.setText(bpm.getEnglishName());
                    rb.setTag(bpm.getId());
                    rb.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
                        @Override
                        public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                            General.getDataBaseRefrenece(BodyPartsMain.class.getSimpleName()).child(buttonView.getTag().toString()).get().addOnSuccessListener(new OnSuccessListener<DataSnapshot>() {
                                @Override
                                public void onSuccess(DataSnapshot dataSnapshot) {
                                   BodyPartsMain bbb = d.getValue(BodyPartsMain.class);
                                   subParts_layout.removeAllViews();
                                   for(int i = 0 ; i < bbb.getSubParts().size(); i++)
                                   {
                                       CheckBox ch = new CheckBox(getContext());
                                       ch.setText(bbb.getSubParts().get(i).getEnglishName());
                                       subParts_layout.addView(ch);
                                   }


                                }
                            });
                        }
                    });
                    bodyPartsRadioGroup.addView(rb);
                }
                bodyParts_layout.addView(bodyPartsRadioGroup);

            }
        });
        genderRadioGroup.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                if(checkedId != -1)
                {
                    RadioButton rb = view.findViewById(checkedId);
                    result.setGender(rb.getText().toString());
                }
            }
        });




        return  builder.create();
    }

    @Override
    public void onStart() {
        super.onStart();
        getDialog().getWindow().getAttributes().windowAnimations = R.anim.slide_in_dialog;
    }
}
