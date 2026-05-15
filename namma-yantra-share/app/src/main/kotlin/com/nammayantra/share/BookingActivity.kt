package com.nammayantra.share

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.nammayantra.share.databinding.ActivityBookingBinding
import com.nammayantra.share.model.Equipment

class BookingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBookingBinding
    private var selectedEquipment: Equipment? = null
    private var currentDuration: Int = 4
    private var startTime = "08:00"
    private var endTime = "12:00"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBookingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        selectedEquipment = intent.getSerializableExtra("EQUIPMENT") as? Equipment

        setupUI()
        calculateDuration()
    }

    private fun setupUI() {
        selectedEquipment?.let {
            binding.tvSelectedName.text = it.name
            binding.tvOwnerDetails.text = "Owner: ${it.owner} | ${it.ownerPhone ?: "N/A"}"
            binding.tvOwnerAddress.text = "Address: ${it.ownerAddress ?: "N/A"}"
            binding.tvHealth.text = "Condition: ${it.healthCondition}${if (it.lastWork != null) " (Last Work: ${it.lastWork})" else ""}"
        }

        binding.btnDatePicker.setOnClickListener {
            binding.btnDatePicker.text = "Selected: May 15, 2026"
        }

        binding.btnStartTime.setOnClickListener {
            showTimePicker { time ->
                startTime = time
                binding.btnStartTime.text = "Start: $time"
                calculateDuration()
            }
        }

        binding.btnEndTime.setOnClickListener {
            showTimePicker { time ->
                endTime = time
                binding.btnEndTime.text = "End: $time"
                calculateDuration()
            }
        }

        binding.btnSubmit.setOnClickListener {
            selectedEquipment?.let {
                val currentFarmer = com.nammayantra.share.data.DataRepository.loggedInUser
                val booking = com.nammayantra.share.model.BookingRequest(
                    id = System.currentTimeMillis().toString(),
                    equipmentId = it.id,
                    equipmentName = it.name,
                    ownerName = it.owner,
                    ownerPhone = it.ownerPhone ?: "98765 43210",
                    ownerAddress = it.ownerAddress ?: "Village Center",
                    farmerName = currentFarmer?.name ?: "Farmer",
                    farmerPhone = currentFarmer?.phone ?: "99887 76655",
                    farmerAddress = currentFarmer?.address ?: "Farmers Colony",
                    startTime = startTime,
                    endTime = endTime,
                    duration = currentDuration,
                    totalAmount = currentDuration * it.hourlyRate
                )
                com.nammayantra.share.data.DataRepository.addBooking(booking)
            }
            Toast.makeText(this, "Request sent to ${selectedEquipment?.owner}!", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    private fun showTimePicker(callback: (String) -> Unit) {
        val timePicker = android.app.TimePickerDialog(this, { _, h, m ->
            val formatted = String.format("%02d:%02d", h, m)
            callback(formatted)
        }, 8, 0, true)
        timePicker.show()
    }

    private fun calculateDuration() {
        val s = startTime.split(":")
        val e = endTime.split(":")
        val startMin = s[0].toInt() * 60 + s[1].toInt()
        val endMin = e[0].toInt() * 60 + e[1].toInt()
        
        currentDuration = if (endMin > startMin) {
            Math.ceil((endMin - startMin) / 60.0).toInt()
        } else {
            1
        }
        
        binding.tvSelectedDuration.text = "Predicted Duration: $currentDuration Hours"
        updatePrice()
    }

    private fun updatePrice() {
        selectedEquipment?.let {
            val total = currentDuration * it.hourlyRate
            binding.tvPriceBreakdown.text = "$currentDuration hours x ₹${it.hourlyRate}"
            binding.tvTotalPrice.text = "Total Prediction: ₹$total"
        }
    }
}
