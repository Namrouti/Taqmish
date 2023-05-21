package com.dresstips.taqmish.Fragments;


import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.SyncStateContract;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.SeekBar;

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
import com.dresstips.taqmish.dialogs.onDaySelectedListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;

import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.List;


public class HomeFragment extends Fragment implements ClosetAdapterHomeFragemntIINterface,
        BodypartHomfragmentInterface, ColorChooserHFragmentInterface ,
        SubPartHomeFragmentInterface, MainClassHomeFragmentInterface , SearchSettingListener, onDaySelectedListener {

    BodyPartsMain selectedBodyPart;
    SiteClosets selectedCloset;
    MainClass selectedMainClass;
    Config selectedConfig;
    int colorRange = 120;
    SeekBar colorSlider;

    SearchSetting searchSetting;

    ImageView mainClassFilterCancelation,bodyPartFilterCancelation,subPartFilterCancelation,resetOutfit,
    saveImg,favoritsImg,cartImg;

    List<String> subPartsFilePath;
    List<Config> subParts;

    Button bodyPartsbtn;
    ImageButton myClosets;

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
        myClosets = view.findViewById(R.id.myCloset);
        colorSlider = view.findViewById(R.id.colorSeeker);
        resetOutfit = view.findViewById(R.id.resetOutfit);
        filter = view.findViewById(R.id.filter);

        filter.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                filterImageClicked(v);
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

        colorSlider.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                colorSlider.setTooltipText(String.valueOf(progress));
                colorRange = progress;
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {

            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {

            }
        });
        saveImg.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                saveOutfit(view);
            }
        });

        myClosets.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                viewMyClosets(v);
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

        bodyPartFilterCancelation = view.findViewById(R.id.bodyPartFilterCancelation);
        subPartFilterCancelation = view.findViewById(R.id.subPartFilterCancelation);
        mainClassFilterCancelation = view.findViewById(R.id.mainClassFilterCancelation);

        bodyPartFilterCancelation.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                cancelBodyPartFilter(v);
            }
        });
        subPartFilterCancelation.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                cancelSubPartFilter(v);
            }
        });
        mainClassFilterCancelation.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                cancelMainClassFilter(v);
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
            if(ColorHelper.isInColorRange(hex, data.get(i).getColors().get(0),60))
            {
                colorFilterResult.add(data.get(i));
            }
        }
        mAdapter.setData(colorFilterResult);
        mAdapter.notifyDataSetChanged();

    }

    private void cancelBodyPartFilter(View v) {
        v.setVisibility(View.INVISIBLE);
        subPartFilterCancelation.setVisibility(View.GONE);
    }
    private void cancelSubPartFilter(View v) {
        v.setVisibility(View.GONE);
    }
    private void cancelMainClassFilter(View v) {
        v.setVisibility(View.GONE);
        bodyPartFilterCancelation.setVisibility(View.GONE);
        subPartFilterCancelation.setVisibility(View.GONE);

    }
    @Override
    public void itemClickedInterface(BodyPartsMain bp) {
        this.selectedBodyPart = bp;
        outfit.setBodyPart(bp.getArabicName());

        bodyPartFilterCancelation.setVisibility(View.VISIBLE);
        Picasso.with(this.getContext()).load(bp.getFilePath()).fit().into(bodyPartFilterCancelation);


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

                            if(ColorHelper.isTowClosetsCompatable(sc,outfit.getTop(),150))
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
       subPartFilterCancelation.setVisibility(View.VISIBLE);
       Picasso.with(this.getContext()).load(filePath).fit().into(subPartFilterCancelation);

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
        mainClassFilterCancelation.setVisibility(View.VISIBLE);
        Picasso.with(this.getContext()).load(mc.getFilePath()).fit().into(mainClassFilterCancelation);
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
        DialogFragment df = new DaysChoiceDialog(this);
        df.show(getActivity().getSupportFragmentManager(),"");
        String uid = ADO.getUserId().getUid();
        DatabaseReference ref = General.getDataBaseRefrenece(OutfitClass.class.getSimpleName());
        outfit.setId(ref.push().getKey());
        ref.child(uid).child(outfit.getId()).setValue(outfit);
    }
    private void viewMyClosets(View v) {
        Intent i = new Intent(this.getContext(), MyClosets.class);
        this.getActivity().startActivity(i);
    }

    @Override
    public void onDialogPositiveClick(SearchSetting result) {
        this.searchSetting = result;

    }

    @Override
    public void onDialogPositiveClick(ArrayList result) {

    }

    @Override
    public void onDialogNegativeClick() {

    }
    private void filterImageClicked(View v) {
        DialogFragment df = new SearchSettingDialog(this);

        df.show(getActivity().getSupportFragmentManager(),"SearchSettingListener");

    }
}
