package com.dresstips.taqmish;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.FragmentPagerAdapter;
import androidx.viewpager.widget.ViewPager;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;

import com.dresstips.taqmish.Activities.ManageClasses;
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

        tabLayout.setupWithViewPager(pager,true);


        VPAdapter adapter = new VPAdapter(getSupportFragmentManager(), FragmentPagerAdapter.BEHAVIOR_RESUME_ONLY_CURRENT_FRAGMENT);
        adapter.addFragment(new HomeFragment(),"Home");
        adapter.addFragment(new MyclothesFragment(),"My Clothes");
        adapter.addFragment(new ShoppingFragment(),"Shopping");

        pager.setAdapter(adapter);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.mainmenu,menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        switch (item.getItemId())
        {
            case R.id.addCloset:
            {
               Intent manageClass = new Intent(this, ManageClasses.class);
               startActivity(manageClass);
                break;
            }
            case R.id.addClassification:
            {


            }
        }
        return super.onOptionsItemSelected(item);
    }
}