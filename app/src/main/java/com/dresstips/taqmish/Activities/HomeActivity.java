package com.dresstips.taqmish.Activities;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.view.MenuItem;

import com.dresstips.taqmish.Fragments.HomeFragment;
import com.dresstips.taqmish.Fragments.ProfileFragment;
import com.dresstips.taqmish.Fragments.SettingsFragment;
import com.dresstips.taqmish.R;
import com.google.android.material.badge.BadgeDrawable;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.navigation.NavigationBarView;

public class HomeActivity extends AppCompatActivity {

    BottomNavigationView bottomNavView;

    HomeFragment homeFragment ;
    SettingsFragment settingFragment ;
    ProfileFragment profileFragment ;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        bottomNavView = findViewById(R.id.bottomNavigationView);
        homeFragment = new HomeFragment();
        settingFragment= new SettingsFragment();
        profileFragment = new ProfileFragment();

        BadgeDrawable badgeDrawable = bottomNavView.getOrCreateBadge(R.id.navigation_notifications);
        badgeDrawable.setVisible(true);
        badgeDrawable.setNumber(8);

        getSupportFragmentManager().beginTransaction().replace(R.id.fragments_container,homeFragment).commit();
        bottomNavView.setOnItemSelectedListener(new BottomNavigationView.OnNavigationItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                switch (item.getItemId())
                {
                    case R.id.navigation_home:
                        getSupportFragmentManager().beginTransaction().replace(R.id.fragments_container,homeFragment).commit();
                        break;
                    case R.id.navigation_profile:
                        getSupportFragmentManager().beginTransaction().replace(R.id.fragments_container,profileFragment).commit();
                        break;
                    case R.id.navigation_dashboard:
                        break;
                    case R.id.navigation_settings:
                        getSupportFragmentManager().beginTransaction().replace(R.id.fragments_container,settingFragment).commit();
                        break;
                    case R.id.navigation_notifications:
                        break;
                }
                return false;

            }
        });
    }
}