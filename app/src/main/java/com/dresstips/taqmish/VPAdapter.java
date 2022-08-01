package com.dresstips.taqmish;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentPagerAdapter;
import androidx.lifecycle.Lifecycle;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import java.util.ArrayList;

public class VPAdapter extends FragmentPagerAdapter {
    ArrayList<Fragment> fragmentArraylist = new ArrayList<>();
    ArrayList<String> titleArralist = new ArrayList<>();

    public VPAdapter(@NonNull FragmentManager fm, int behavior) {
        super(fm, behavior);
    }

    public void addFragment(Fragment fragemnt,String title)
    {
        fragmentArraylist.add(fragemnt);
        titleArralist.add(title);
    }

    @Override
    public int getCount() {
        return fragmentArraylist.size();
    }

    public CharSequence getPageTitle(int position)
    {
        return titleArralist.get(position);
    }

    @NonNull
    @Override
    public Fragment getItem(int position) {
        return fragmentArraylist.get(position);
    }
}
