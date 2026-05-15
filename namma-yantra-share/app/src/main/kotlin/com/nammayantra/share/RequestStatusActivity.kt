package com.nammayantra.share

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.nammayantra.share.databinding.ActivityRequestStatusBinding

class RequestStatusActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRequestStatusBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRequestStatusBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnBack.setOnClickListener {
            onBackPressed()
        }
    }
}
