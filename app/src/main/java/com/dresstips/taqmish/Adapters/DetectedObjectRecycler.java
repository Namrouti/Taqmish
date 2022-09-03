package com.dresstips.taqmish.Adapters;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Rect;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.dresstips.taqmish.R;

import com.google.mlkit.vision.objects.DetectedObject;


import java.util.List;


public class DetectedObjectRecycler extends  RecyclerView.Adapter<DetectedObjectRecycler.ViewHolder> {

   List<DetectedObject> detected;
   Bitmap image ;
   public DetectedObjectRecycler(List<DetectedObject> detected, Bitmap image)
   {
       this.detected = detected;
       this.image = image;
   }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.object_detected,parent,false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

       DetectedObject obj = (DetectedObject) detected.get(position);
       holder.getImageView().setImageBitmap(cutBitmap(image,obj.getBoundingBox()));

    }

    public static Bitmap cutBitmap(Bitmap originalBitmap, Rect srcRect){
        Bitmap cutted = Bitmap.createBitmap(Math.abs(srcRect.left - srcRect.right), Math.abs(srcRect.top - srcRect.bottom), originalBitmap.getConfig());
        Canvas cutCanvas = new Canvas(cutted);
        Rect destRect = new Rect(0x0, 0x0, cutted.getWidth(), cutted.getHeight());
        cutCanvas.drawBitmap(originalBitmap, srcRect, destRect, null);
        return cutted;
    }

    @Override
    public int getItemCount() {
        return detected.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder{
        private final TextView textView;
        private final ImageView imageView;
        private final Button save, delete;
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            textView = (TextView) itemView.findViewById(R.id.textView);
            imageView = (ImageView) itemView.findViewById(R.id.imageView);
            save = (Button) itemView.findViewById(R.id.save);
            delete = (Button) itemView.findViewById(R.id.delete);
            save.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {

                }
            });

        }
        public TextView getTextView()
        {
            return textView;
        }
        public ImageView getImageView()
        {
            return imageView;
        }
        public Button getSave()
        {
            return save;
        }
        public  Button getDelete()
        {
            return delete;
        }
    }
}
