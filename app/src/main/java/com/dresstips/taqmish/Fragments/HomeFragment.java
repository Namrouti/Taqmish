package com.dresstips.taqmish.Fragments;


import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.SyncStateContract;
import android.util.Log;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.SeekBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.ADO.ADO;
import com.dresstips.taqmish.Activities.MyClosets;
import com.dresstips.taqmish.Adapters.BodyPartsAdapter;
import com.dresstips.taqmish.Adapters.ClosetsAdapter;
import com.dresstips.taqmish.Adapters.ConfigAdapter;
import com.dresstips.taqmish.Adapters.SubPartsAdapter;
import com.dresstips.taqmish.InteractionActivity;
import com.dresstips.taqmish.Interfaces.BodypartHomfragmentInterface;
import com.dresstips.taqmish.Interfaces.ClosetAdapterHomeFragemntIINterface;
import com.dresstips.taqmish.Interfaces.ColorChooserHFragmentInterface;
import com.dresstips.taqmish.Interfaces.MainClassHomeFragmentInterface;
import com.dresstips.taqmish.Interfaces.SubPartHomeFragmentInterface;
import com.dresstips.taqmish.R;
import com.dresstips.taqmish.classes.BodyParts;
import com.dresstips.taqmish.classes.BodyPartsMain;
import com.dresstips.taqmish.classes.CalendarItem;
import com.dresstips.taqmish.classes.ColorHelper;
import com.dresstips.taqmish.classes.Config;
import com.dresstips.taqmish.classes.General;
import com.dresstips.taqmish.classes.MainClass;
import com.dresstips.taqmish.classes.OutfitClass;
import com.dresstips.taqmish.classes.SearchSetting;
import com.dresstips.taqmish.classes.SiteClosets;
import com.dresstips.taqmish.dialogs.ColorChooser;
import com.dresstips.taqmish.dialogs.DaysChoiceDialog;
import com.dresstips.taqmish.dialogs.SearchSettingDialog;
import com.dresstips.taqmish.dialogs.SearchSettingListener;
import com.dresstips.taqmish.dialogs.SeekBarDialog;
import com.dresstips.taqmish.dialogs.SeekBarListener;
import com.dresstips.taqmish.dialogs.onDaySelectedListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;

import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;
import com.squareup.picasso.Picasso;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;


public class HomeFragment extends Fragment implements ClosetAdapterHomeFragemntIINterface,
        BodypartHomfragmentInterface, ColorChooserHFragmentInterface ,
        SubPartHomeFragmentInterface, MainClassHomeFragmentInterface , SearchSettingListener, onDaySelectedListener, SeekBarListener, View.OnTouchListener {

    BodyPartsMain selectedBodyPart;
    SiteClosets selectedCloset;
    MainClass selectedMainClass;
    Config selectedConfig;
    int colorRange = 120;
    ImageButton colorSlider;

    SearchSetting searchSetting;

    ImageView resetOutfit,
    saveImg;

    List<String> subPartsFilePath;
    List<Config> subParts;

    Button bodyPartsbtn;

    ArrayList<SiteClosets> data;
    ArrayList<MainClass> mainClassArr;
    ArrayList<BodyPartsMain> bodyPartsArr;

    ArrayList<SiteClosets> onBodyPartsCangedArr;
    ArrayList<SiteClosets> onSubPartsChangedArr;
    ArrayList<SiteClosets> onMainClassChangedArr;

    ImageButton mainFav, mainNot, mainCart;

    RecyclerView closetRecy,leftRecy,rightRecy;
    DatabaseReference mDBRef,bpDBRes,mcDBRef;
    ClosetsAdapter mAdapter;
    ConfigAdapter configAdapter;
    BodyPartsAdapter bodyPartAdaper;
    OutfitClass outfit;
    ImageView topimage,downimage,watch,shoos, filter;
    View pickColor;
    DialogFragment colorChooser;

    Query dataQuery,bodyPartQuery,subPartQuery,mainQuery;

    int initialX, initialY;
    float initialTouchX, initialTouchY;

    int mDefaulColor;
    String hex;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.frgament_home_new,container,false);

        InteractionActivity mActivity = (InteractionActivity) getActivity();

        mainCart = mActivity.findViewById(R.id.mainCrat);
        mainFav = mActivity.findViewById(R.id.mainFav);
        mainNot = mActivity.findViewById(R.id.mainNotification);

        onBodyPartsCangedArr = new ArrayList<>();
        onSubPartsChangedArr = new ArrayList<>();
        onMainClassChangedArr = new ArrayList<>();

        saveImg = view.findViewById(R.id.save);
        colorSlider = view.findViewById(R.id.colorSeeker);
        resetOutfit = view.findViewById(R.id.resetOutfit);
        filter = view.findViewById(R.id.filter);

        filter.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                filterImageClicked(v);
            }
        });

        colorSlider.setOnKeyListener(new View.OnKeyListener() {
            @Override
            public boolean onKey(View v, int keyCode, KeyEvent event) {
                if(keyCode == event.KEYCODE_VOLUME_UP || keyCode == event.KEYCODE_VOLUME_DOWN)
                {
                    DialogFragment dialog = new SeekBarDialog(HomeFragment.this.getContext(),255,0,colorRange,"Increase to get more result",HomeFragment.this);
                    dialog.show(HomeFragment.this.getActivity().getSupportFragmentManager(),"");
                    return true;
                }
                return false;
            }
        });


        resetOutfit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                outfit = new OutfitClass();
                topimage.setImageBitmap(null);
                downimage.setImageBitmap(null);
                watch.setImageBitmap(null);
                shoos.setImageBitmap(null);
            }
        });


        saveImg.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                saveOutfit(view);
            }
        });

        colorSlider.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                DialogFragment dialog = new SeekBarDialog(HomeFragment.this.getContext(),255,0,colorRange,"Increase to get more result",HomeFragment.this);
                dialog.show(HomeFragment.this.getActivity().getSupportFragmentManager(),"");
            }
        });



        outfit = new OutfitClass();
        topimage = view.findViewById(R.id.topimage);
        downimage = view.findViewById(R.id.downimage);
        watch = view.findViewById(R.id.watch);
        shoos = view.findViewById(R.id.shoos);
        bodyPartsbtn = view.findViewById(R.id.bodyPartsbtn);
        bodyPartsbtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                bodyPartsButtonCLicked(v);
            }
        });



        topimage.setOnTouchListener(this);
        downimage.setOnTouchListener(this);
        shoos.setOnTouchListener(this);
        watch.setOnTouchListener(this);






        subParts = new ArrayList();
        subPartsFilePath = new ArrayList();

        data = new ArrayList();
        mDBRef = General.getDataBaseRefrenece(SiteClosets.class.getSimpleName());
        dataQuery= mDBRef.orderByChild("bodyPart").equalTo("الجزء العلوي");
        mDBRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                for(DataSnapshot d : snapshot.getChildren())
                {
                    SiteClosets sc  = d.getValue(SiteClosets.class);
                    HomeFragment.this.data.add(sc);
                    HomeFragment.this.mAdapter.notifyItemChanged(HomeFragment.this.data.size()-1);
                    mAdapter.dataCanged();
                }

            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });
        closetRecy = view.findViewById(R.id.closetRecy);
        mAdapter = new ClosetsAdapter(data,this.getContext(),this);
        closetRecy.setAdapter(mAdapter);
        closetRecy.setLayoutManager(new LinearLayoutManager(this.getContext(),LinearLayoutManager.HORIZONTAL,false));

        bodyPartsArr = new ArrayList();
        bpDBRes = General.getDataBaseRefrenece(BodyPartsMain.class.getSimpleName());
        bpDBRes.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                HomeFragment.this.bodyPartsArr.clear();
                for(DataSnapshot d : snapshot.getChildren())
                {
                    BodyPartsMain mc = d.getValue(BodyPartsMain.class);
                    HomeFragment.this.bodyPartsArr.add(mc);
                    HomeFragment.this.bodyPartAdaper.notifyItemChanged( HomeFragment.this.bodyPartsArr.size() - 1);
                }

            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });
        rightRecy = view.findViewById(R.id.rightRecy);
        bodyPartAdaper = new BodyPartsAdapter(bodyPartsArr,this.getContext(), this);
        rightRecy.setAdapter(bodyPartAdaper);
        rightRecy.setLayoutManager(new LinearLayoutManager(this.getContext(),LinearLayoutManager.VERTICAL,false));


        mainClassArr = new ArrayList<>();
        mcDBRef = General.getDataBaseRefrenece(MainClass.class.getSimpleName());
        mcDBRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                HomeFragment.this.mainClassArr.clear();
                for (DataSnapshot d : snapshot.getChildren())
                {
                    MainClass mc = d.getValue(MainClass.class);
                    HomeFragment.this.mainClassArr.add(mc);
                    HomeFragment.this.configAdapter.notifyItemChanged(HomeFragment.this.mainClassArr.size() - 1);

                }

            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });
        leftRecy = view.findViewById(R.id.lefRecy);
        configAdapter = new ConfigAdapter(mainClassArr,this.getContext(),this);
        leftRecy.setAdapter(configAdapter);
        leftRecy.setLayoutManager(new LinearLayoutManager(this.getContext(),LinearLayoutManager.VERTICAL,false));



        mDefaulColor = ContextCompat.getColor(this.getContext(), com.firebase.ui.auth.R.color.design_default_color_on_primary);
        pickColor = view.findViewById(R.id.pickColor);
        pickColor.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                openColorPicker();
            }
        });




        return view;
    }




    private void bodyPartsButtonCLicked(View v) {

        rightRecy.setAdapter(bodyPartAdaper);
        mAdapter.setData(data);
        mAdapter.notifyDataSetChanged();

    }


    private void openColorPicker() {
        if(colorChooser == null)
        {
            colorChooser = new ColorChooser(this);
        }
        else
        {
            colorChooser.show(this.getActivity().getSupportFragmentManager(),"Choose Color");
        }
    }


    @Override
    public void itemClicked(SiteClosets sc, ImageView iv) {
        this.selectedCloset = sc;

        if(sc.getBodyPart().equals("الجزء العلوي")) {
            outfit.setTop(sc);

            Picasso.with(HomeFragment.this.getContext()).load(sc.getFilePath()).fit().into(topimage);
            outfit.setTop(sc);


        }
        else if(sc.getBodyPart().equals("الجزء السفلي")){
            outfit.setDown(sc);

            Picasso.with(HomeFragment.this.getContext()).load(sc.getFilePath()).fit().into(downimage);

        }
        else if(sc.getBodyPart().equals("اكسسوارات")){
            if(sc.getSubParts().equals("ساعه"))
            {
                Picasso.with(HomeFragment.this.getContext()).load(sc.getFilePath()).fit().into(watch);
                outfit.setAccessories(sc);

            }
            else if(sc.getSubParts().equals("حذاء"))
            {
                Picasso.with(HomeFragment.this.getContext()).load(sc.getFilePath()).fit().into(shoos);
                outfit.setShoes(sc);
            }


        }

        Log.i("SiteCloset","FilePathe: " + sc.getFilePath()  + " body part " + sc.getBodyPart() );
    }



    @Override
    public void getColor(String hex) {

        int c1 = Color.parseColor(hex);

        int r = Color.red(c1);
        int g = Color.green(c1);
        int b = Color.blue(c1);

        pickColor.setBackgroundColor(Color.rgb(r,g,b));
        this.hex = hex;
        ArrayList<SiteClosets> colorFilterResult =  new ArrayList<>();
        for(int i=0 ; i < data.size(); i ++)
        {
            if(ColorHelper.isInColorRange(hex, data.get(i).getColors().get(0),colorRange))
            {
                colorFilterResult.add(data.get(i));
            }
        }
        mAdapter.setData(colorFilterResult);
        mAdapter.notifyDataSetChanged();

    }


    @Override
    public void itemClickedInterface(BodyPartsMain bp) {
        this.selectedBodyPart = bp;
        outfit.setBodyPart(bp.getArabicName());
        bodyPartQuery = mDBRef.orderByChild("bodyPart").equalTo(bp.getArabicName());
        bodyPartQuery.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                onBodyPartsCangedArr.clear();
                for(DataSnapshot d : snapshot.getChildren())
                {
                    SiteClosets sc = d.getValue(SiteClosets.class);
                    if(bp.getEnglishName().equals("Up") && outfit.getDown() != null)
                    {
                            if(ColorHelper.isTowClosetsCompatable(sc,outfit.getDown(),colorRange))
                            {
                                onBodyPartsCangedArr.add(sc);
                            }

                    }
                    else if(bp.getEnglishName().equals("down") && outfit.getTop() != null)
                    {

                            if(ColorHelper.isTowClosetsCompatable(sc,outfit.getTop(),colorRange))
                            {
                                onBodyPartsCangedArr.add(sc);
                            }

                    }
                    else
                    {
                        onBodyPartsCangedArr.add(sc);
                    }
                }
                mAdapter.setData(onBodyPartsCangedArr);
                mAdapter.notifyDataSetChanged();
                mAdapter.dataCanged();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });

        //  mAdapter.getFilter().filter(bp.getArabicName());

        this.subParts = bp.getSubParts();
        this.subPartsFilePath = bp.getSubPartsFilePath();
        rightRecy.setAdapter(new SubPartsAdapter(subParts,subPartsFilePath,this.getContext(),this));
        bodyPartsbtn.setVisibility(View.VISIBLE);
    }

    @Override
    public void subPartsClicked(Config sp,String filePath) {
        selectedConfig = sp;


        subPartQuery = mDBRef.orderByChild("bodyPart").equalTo(selectedBodyPart.getArabicName());
        subPartQuery.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                onSubPartsChangedArr.clear();
                for(DataSnapshot d: snapshot.getChildren())
                {
                    SiteClosets sc = d.getValue(SiteClosets.class);
                    if(sc.getSubParts().equals(selectedConfig.getArabicName())) {

                        onSubPartsChangedArr.add(sc);
                    }

                }
                mAdapter.setData(onSubPartsChangedArr);
                mAdapter.notifyDataSetChanged();
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {

            }
        });
    }

    @Override
    public void mainClassClicked(MainClass mc) {
        selectedMainClass = mc;

        this.selectedMainClass = mc;
        rightRecy.setVisibility(View.VISIBLE);
       onMainClassChangedArr.clear();
       mainQuery = mDBRef.orderByChild("MainClass").equalTo(mc.getArabicName());
       mainQuery.addValueEventListener(new ValueEventListener() {
           @Override
           public void onDataChange(@NonNull DataSnapshot snapshot) {
               for(DataSnapshot d : snapshot.getChildren())
               {
                   SiteClosets sc = d.getValue(SiteClosets.class);
                   if(sc.mainClass.equals(mc.getArabicName()))
                   {
                       onMainClassChangedArr.add(sc);
                   }
               }
           }

           @Override
           public void onCancelled(@NonNull DatabaseError error) {

           }
       });
       for(int i = 0 ; i < data.size(); i ++)
       {

       }
    //   mAdapter.setData(onMainClassChangedArr);
    //   mAdapter.notifyDataSetChanged();

    }

    private void saveOutfit(View view) {
      //  DialogFragment df = new DaysChoiceDialog(this);
     //   df.show(getActivity().getSupportFragmentManager(),"");
        String uid = ADO.getUserId().getUid();
        DatabaseReference ref = General.getDataBaseRefrenece(OutfitClass.class.getSimpleName());
        outfit.setId(ref.push().getKey());
        ref.child(uid).child(outfit.getId()).setValue(outfit).addOnSuccessListener(new OnSuccessListener<Void>() {
            @Override
            public void onSuccess(Void unused) {
              showSaveToCalenderDialog();


            }
        });
    }

    private void showSaveToCalenderDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this.getContext());
        View saveDailog = LayoutInflater.from(this.getContext()).inflate(R.layout.save_to_calender,null);
        builder.setView(saveDailog);
        builder.setCancelable(true);

        //get all component
        ImageButton showCalendar = saveDailog.findViewById(R.id.showCalendar);
        TextView datetxt = saveDailog.findViewById(R.id.datetxt);
        ImageView topimage = saveDailog.findViewById(R.id.topimage);
        ImageView downimage = saveDailog.findViewById(R.id.downimage);
        ImageView shoos = saveDailog.findViewById(R.id.shoos);
        ImageView watch = saveDailog.findViewById(R.id.watch);
        RadioGroup timeRadioGroup = saveDailog.findViewById(R.id.timeRadioGroup);
        CalendarItem item = new CalendarItem();

        if(outfit.getTop() != null)
        {
            Picasso.with(getContext()).load(outfit.getTop().filePath).into(topimage);
        }
        if(outfit.getDown() != null)
        {
            Picasso.with(getContext()).load(outfit.getDown().filePath).into(downimage);
        }
        if(outfit.getShoes() != null)
        {
            Picasso.with(getContext()).load(outfit.getShoes().filePath).into(shoos);
        }
        if(outfit.getAccessories() != null)
        {
            Picasso.with(getContext()).load(outfit.getAccessories().filePath).into(watch);
        }

        Calendar calendar = Calendar.getInstance();
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int year = calendar.get(Calendar.YEAR);
        showCalendar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                DatePickerDialog picker = new DatePickerDialog(HomeFragment.this.getContext(), new DatePickerDialog.OnDateSetListener() {
                    @Override
                    public void onDateSet(DatePicker datePicker, int selectedYear, int selectedmonth, int selectedday) {

                        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd",Locale.ENGLISH);
                        datetxt.setText( String.format("%02d",selectedday) + "-" + String.format("%02d", (selectedmonth + 1)) + "-" + selectedYear);

                    }
                },year,month,day);
                picker.show();

            }
        });

        builder.setCancelable(true);
        builder.setPositiveButton("Save", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {

                item.setDate(datetxt.getText().toString());
                item.setOutfitID(outfit.getId());
                DatabaseReference ref = General.getDataBaseRefrenece(CalendarItem.class.getSimpleName());
                item.setItemID(ref.push().getKey());
                ref.child(ADO.getUserId().getUid()).child(item.getItemID()).setValue(item);

            }
        });
        timeRadioGroup.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                if(checkedId != -1)
                {
                    RadioButton rb = saveDailog.findViewById(checkedId);
                    item.setTime(rb.getText().toString());

                }
            }
        });

        builder.create().show();
    }


    @Override
    public void onDialogPositiveClick(SearchSetting result) {
        this.searchSetting = result;

    }

    @Override
    public void onDialogPositiveClick(ArrayList result) {

    }

    @Override
    public void onDialogPositiveClick(int result) {
        colorRange = result;
        if(this.selectedBodyPart != null) {
            itemClickedInterface(this.selectedBodyPart);
        }

    }

    @Override
    public void onDialogNegativeClick() {

    }
    private void filterImageClicked(View v) {
        DialogFragment df = new SearchSettingDialog(this);

        df.show(getActivity().getSupportFragmentManager(),"SearchSettingListener");

    }

    @Override
    public boolean onTouch(View view1, MotionEvent event) {
        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:
                // Store initial touch coordinates and ImageView position
                initialTouchX = event.getRawX();
                initialTouchY = event.getRawY();
                initialX = (int) view1.getX();
                initialY = (int) view1.getY();
                return true;
            case MotionEvent.ACTION_MOVE:
                // Calculate new position based on touch movement
                int offsetX = (int) (event.getRawX() - initialTouchX);
                int offsetY = (int) (event.getRawY() - initialTouchY);
                int newX = initialX + offsetX;
                int newY = initialY + offsetY;
                // Update ImageView position
                view1.setX(newX);
                view1.setY(newY);
                return true;
            default:
                return false;
        }
    }
}
