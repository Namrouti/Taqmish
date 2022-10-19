package com.dresstips.taqmish;

import android.os.Bundle;
import android.view.MenuItem;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;

import com.dresstips.taqmish.Fragments.HomeFragment;
import com.dresstips.taqmish.Fragments.ProfileFragment;
import com.dresstips.taqmish.Fragments.SettingsFragment;
import com.google.android.material.navigation.NavigationView;

public class InteractionActivity extends AppCompatActivity {


    DrawerLayout drawer;
    ActionBarDrawerToggle toggle;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_interaction);

        Toolbar toolBar = findViewById(R.id.toolBar);
        setSupportActionBar(toolBar);

        drawer = findViewById(R.id.drawer_layout);
        NavigationView navView = findViewById(R.id.nav_view);
        navView.setNavigationItemSelectedListener(new NavigationView.OnNavigationItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                switch (item.getItemId())
                {
                    case R.id.nav_home:
                        InteractionActivity.this.getSupportFragmentManager().beginTransaction()
                                .replace(R.id.fragment_container,new HomeFragment()).commit();

                        break;
                    case R.id.nav_profile:
                        InteractionActivity.this.getSupportFragmentManager().beginTransaction()
                                .replace(R.id.fragment_container,new ProfileFragment()).commit();
                        break;
                    case R.id.nav_setting:
                        InteractionActivity.this.getSupportFragmentManager().beginTransaction()
                                .replace(R.id.fragment_container,new SettingsFragment()).commit();
                     //   InteractionActivity.this.startActivity(new Intent(InteractionActivity.this, SettingActivity.class));
                        break;
                    case R.id.nav_share:
                        Toast.makeText(InteractionActivity.this,"Share",Toast.LENGTH_LONG).show();
                        break;
                    case R.id.nav_send:
                        Toast.makeText(InteractionActivity.this,"Send",Toast.LENGTH_LONG).show();
                        break;
                    case R.id.logout:
                        Toast.makeText(InteractionActivity.this,"Logout",Toast.LENGTH_LONG).show();
                        break;
                }
                drawer.closeDrawer(GravityCompat.START);
                return true;
            }
        });

         toggle = new ActionBarDrawerToggle(this,drawer,toolBar,R.string.navigation_drawer_open,R.string.navigation_drawer_close);
        drawer.addDrawerListener(toggle);
        toggle.syncState();
        if(savedInstanceState == null) {
            getSupportFragmentManager().beginTransaction()
                    .replace(R.id.fragment_container, new HomeFragment()).commit();
            navView.setCheckedItem(R.id.nav_home);
        }

    }

    @Override
    public void onBackPressed() {
        if(drawer.isDrawerOpen(GravityCompat.START))
        {
            drawer.closeDrawer(GravityCompat.START);
        }
        else {
            super.onBackPressed();
        }
    }
}