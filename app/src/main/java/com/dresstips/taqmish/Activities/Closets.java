package com.dresstips.taqmish.Activities;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import android.os.Bundle;
import android.view.MenuItem;
import android.widget.FrameLayout;

import com.dresstips.taqmish.Fragments.HomeFragment;
import com.dresstips.taqmish.Fragments.ProfileFragment;
import com.dresstips.taqmish.Fragments.SettingsFragment;
import com.dresstips.taqmish.R;
import com.google.android.material.bottomnavigation.BottomNavigationView;

public class Closets extends AppCompatActivity {
    BottomNavigationView bottomNav;
    FrameLayout frameLayout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_closets);

        bottomNav = findViewById(R.id.bottomNav);
        frameLayout = findViewById(R.id.frameLayout);

        bottomNav.setOnNavigationItemSelectedListener(navigationSelectListener);
        getSupportFragmentManager().beginTransaction().replace(R.id.frameLayout,new HomeFragment()).commit();


    }
    private BottomNavigationView.OnNavigationItemSelectedListener navigationSelectListener = new BottomNavigationView.OnNavigationItemSelectedListener() {
        @Override
        public boolean onNavigationItemSelected(@NonNull MenuItem item) {
            Fragment selectedFragment = null;

            switch (item.getItemId())
            {
                case R.id.home:
                    selectedFragment = new HomeFragment();
                    break;
                case R.id.shop:
                    selectedFragment = new ProfileFragment();
                    break;
                case R.id.myCloset:
                    selectedFragment = new SettingsFragment();
                    break;
                default:
                    if(selectedFragment == null)
                    {
                        selectedFragment = new HomeFragment();
                    }
                    break;
            }
            getSupportFragmentManager().beginTransaction().replace(R.id.frameLayout,selectedFragment).commit();
            return true;
        }
    };
}