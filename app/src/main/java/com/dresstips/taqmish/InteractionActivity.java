package com.dresstips.taqmish;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.FragmentPagerAdapter;
import androidx.viewpager.widget.ViewPager;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import android.os.Bundle;

import com.google.android.material.tabs.TabLayout;

public class InteractionActivity extends AppCompatActivity {

    TabLayout tabLayout;
    ViewPager pager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_interaction);

        tabLayout = findViewById(R.id.tabLayout);
        pager = findViewById(R.id.viewPager);

        tabLayout.setupWithViewPager(pager);

        VPAdapter adapter = new VPAdapter(getSupportFragmentManager(), FragmentPagerAdapter.BEHAVIOR_RESUME_ONLY_CURRENT_FRAGMENT);
        adapter.addFragment(new HomeFragment(),"Home");
        adapter.addFragment(new MyclothesFragment(),"My Clothes");
        adapter.addFragment(new ShoppingFragment(),"Shopping");

        pager.setAdapter(adapter);
    }
}