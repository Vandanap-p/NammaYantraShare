package com.nammayantra.share.adapter

import android.content.Intent
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.nammayantra.share.BookingActivity
import com.nammayantra.share.databinding.ItemEquipmentBinding
import com.nammayantra.share.model.Equipment

class EquipmentAdapter : RecyclerView.Adapter<EquipmentAdapter.ViewHolder>() {

    private var items: List<Equipment> = listOf()

    fun setItems(newItems: List<Equipment>) {
        items = newItems
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemEquipmentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(private val binding: ItemEquipmentBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: Equipment) {
            val prefs = binding.root.context.getSharedPreferences("NAMMA_PREFS", android.content.Context.MODE_PRIVATE)
            val role = prefs.getString("ROLE", "FARMER")
            val currentUserName = prefs.getString("NAME", "") ?: ""

            binding.tvName.text = item.name
            binding.tvOwner.text = if (item.owner == currentUserName) "Owner: YOU" else "Owner: ${item.owner}"
            binding.tvOwnerPhone.text = "Phone: ${item.ownerPhone ?: "N/A"}"
            binding.tvOwnerAddress.text = "Address: ${item.ownerAddress ?: "N/A"}"
            binding.tvRate.text = "₹${item.hourlyRate} / Hour"
            binding.tvDistance.text = "${item.distanceKm} km away"
            binding.tvHealth.text = "Health: ${item.healthCondition}"
            
            if (!item.lastWork.isNullOrEmpty()) {
                binding.tvLastWork.text = "Last Work: ${item.lastWork}"
                binding.tvLastWork.visibility = android.view.View.VISIBLE
            } else {
                binding.tvLastWork.visibility = android.view.View.GONE
            }
            if (!item.details.isNullOrEmpty()) {
                binding.tvDetails.text = item.details
                binding.tvDetails.visibility = android.view.View.VISIBLE
            } else {
                binding.tvDetails.visibility = android.view.View.GONE
            }

            binding.tvAvailability.text = if (item.isAvailable) "Available Now" else "Currently Busy"
            binding.tvAvailability.setTextColor(
                if (item.isAvailable) 
                    binding.root.context.getColor(android.R.color.holo_green_dark)
                else 
                    binding.root.context.getColor(android.R.color.holo_red_dark)
            )

            val isMyMachine = item.owner == currentUserName && role == "OWNER"
            binding.btnUpdateHealthAction.visibility = if (isMyMachine) android.view.View.VISIBLE else android.view.View.GONE
            binding.llUpdateHealth.visibility = android.view.View.GONE

            binding.btnUpdateHealthAction.setOnClickListener {
                binding.llUpdateHealth.visibility = if (binding.llUpdateHealth.visibility == android.view.View.VISIBLE) android.view.View.GONE else android.view.View.VISIBLE
                binding.etNewHealth.setText(item.healthCondition)
            }

            binding.btnSaveHealth.setOnClickListener {
                val newHealth = binding.etNewHealth.text.toString()
                if (newHealth.isNotEmpty()) {
                    item.healthCondition = newHealth
                    binding.tvHealth.text = "Health: $newHealth"
                    binding.llUpdateHealth.visibility = android.view.View.GONE
                    android.widget.Toast.makeText(binding.root.context, "Health updated!", android.widget.Toast.LENGTH_SHORT).show()
                }
            }

            binding.btnRent.isEnabled = (item.owner != currentUserName && role == "FARMER")
            binding.btnRent.text = if (isMyMachine) "MY UNIT" 
                                  else if (role == "OWNER") "OWNER VIEW" 
                                  else "RENT NOW"
            binding.btnRent.alpha = if (binding.btnRent.isEnabled) 1.0f else 0.5f

            binding.btnRent.setOnClickListener {
                if (!binding.btnRent.isEnabled) return@setOnClickListener
                val intent = Intent(binding.root.context, BookingActivity::class.java).apply {
                    putExtra("EQUIPMENT", item)
                }
                binding.root.context.startActivity(intent)
            }
        }
    }
}
