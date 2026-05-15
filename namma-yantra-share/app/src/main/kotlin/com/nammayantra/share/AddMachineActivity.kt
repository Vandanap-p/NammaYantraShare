package com.nammayantra.share

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.nammayantra.share.databinding.ActivityAddMachineBinding

class AddMachineActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val binding = ActivityAddMachineBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnSave.setOnClickListener {
            val name = binding.etMachineName.text.toString()
            val rate = binding.etHourlyRate.text.toString().toIntOrNull() ?: 0
            val details = binding.etMachineDetails.text.toString()
            
            val prefs = getSharedPreferences("NAMMA_PREFS", MODE_PRIVATE)
            val userName = prefs.getString("NAME", "Anonymous") ?: "Anonymous"

            if (name.isNotEmpty() && rate > 0) {
                val user = com.nammayantra.share.data.DataRepository.loggedInUser
                val newMachine = com.nammayantra.share.model.Equipment(
                    id = System.currentTimeMillis().toString(),
                    name = name,
                    type = "Machine",
                    owner = user?.name ?: userName,
                    ownerPhone = user?.phone,
                    ownerAddress = user?.address,
                    hourlyRate = rate,
                    healthCondition = "Excellent",
                    isAvailable = true,
                    distanceKm = 0.0,
                    details = details
                )
                com.nammayantra.share.data.DataRepository.addEquipment(newMachine)
                Toast.makeText(this, "$name listed successfully!", Toast.LENGTH_SHORT).show()
                finish()
            } else {
                Toast.makeText(this, "Please enter correct machine details", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
