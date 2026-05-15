package com.nammayantra.share

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.nammayantra.share.databinding.ActivityManageRequestsBinding
import com.nammayantra.share.databinding.ItemRequestBinding

class ManageRequestsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityManageRequestsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityManageRequestsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.rvRequests.layoutManager = LinearLayoutManager(this)
        
        val currentOwnerName = com.nammayantra.share.data.DataRepository.loggedInUser?.name ?: ""
        val myReceivedRequests = com.nammayantra.share.data.DataRepository.getAllBookings().filter { 
            it.ownerName.equals(currentOwnerName, ignoreCase = true) 
        }
        
        binding.rvRequests.adapter = RequestAdapter(myReceivedRequests)
    }

    inner class RequestAdapter(private val requests: List<com.nammayantra.share.model.BookingRequest>) : RecyclerView.Adapter<RequestAdapter.ViewHolder>() {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val b = ItemRequestBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return ViewHolder(b)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.bind(requests[position])
        }

        override fun getItemCount(): Int = requests.size

        inner class ViewHolder(val b: ItemRequestBinding) : RecyclerView.ViewHolder(b.root) {
            fun bind(data: com.nammayantra.share.model.BookingRequest) {
                b.tvFarmerName.text = data.farmerName
                b.tvFarmerContact.text = "Phone: ${data.farmerPhone}"
                b.tvFarmerAddress.text = "Address: ${data.farmerAddress}"
                b.tvDetails.text = "Machine: ${data.equipmentName} | Duration: ${data.duration} hrs"
                b.tvRequestTime.text = "${data.startTime} to ${data.endTime} | ${data.date}"
                
                // Reset visibility
                b.llActions.visibility = View.GONE
                b.tvStatusLabel.visibility = View.GONE
                b.llAcceptedOwnerActions.visibility = View.GONE
                b.btnFinalize.visibility = View.GONE
                b.tvFinalized.visibility = View.GONE
                b.btnOwnerMarkDone.visibility = View.GONE
                b.tvWorkDone.visibility = View.GONE
                b.tvOwnerReviewDisplay.visibility = View.GONE

                if (data.isCompleted) {
                    b.tvStatusLabel.visibility = View.VISIBLE
                    b.tvStatusLabel.text = "ARCHIVED (COMPLETED)"
                    b.tvWorkDone.visibility = View.VISIBLE
                    if (data.isReviewed) {
                        b.tvOwnerReviewDisplay.visibility = View.VISIBLE
                        b.tvOwnerReviewDisplay.text = "Review from Farmer: ${data.rating.toInt()} Stars - ${data.comment}"
                    }
                } else if (data.status == "PENDING") {
                    b.llActions.visibility = View.VISIBLE
                    
                    b.btnConfirm.setOnClickListener {
                        data.status = "ACCEPTED"
                        notifyItemChanged(adapterPosition)
                    }

                    b.btnReject.setOnClickListener {
                        data.status = "DECLINED"
                        notifyItemChanged(adapterPosition)
                    }
                } else if (data.status == "ACCEPTED") {
                    b.tvStatusLabel.visibility = View.VISIBLE
                    b.tvStatusLabel.text = "ACCEPTED"
                    b.tvStatusLabel.setTextColor(getColor(R.color.status_accepted))
                    b.llAcceptedOwnerActions.visibility = View.VISIBLE

                    b.btnCallFarmer.setOnClickListener {
                        val intent = android.content.Intent(android.content.Intent.ACTION_DIAL)
                        intent.data = android.net.Uri.parse("tel:${data.farmerPhone}")
                        startActivity(intent)
                    }

                    if (data.ownerFinalized) {
                        b.tvFarmerConfirmStatus.visibility = View.GONE
                        b.tvFinalized.visibility = View.VISIBLE
                        b.btnOwnerMarkDone.visibility = View.VISIBLE
                    } else if (data.farmerConfirmed) {
                        b.tvFarmerConfirmStatus.text = "Farmer Confirmed"
                        b.tvFarmerConfirmStatus.setBackgroundColor(getColor(android.R.color.holo_blue_light))
                        
                        if (data.paymentMethod != null) {
                            b.tvFarmerConfirmStatus.text = "Farmer Confirmed | Payment: ${data.paymentMethod}"
                            b.btnFinalize.visibility = View.VISIBLE
                        }
                    } else {
                        b.tvFarmerConfirmStatus.visibility = View.VISIBLE
                    }

                    b.btnFinalize.setOnClickListener {
                        data.ownerFinalized = true
                        notifyItemChanged(adapterPosition)
                        Toast.makeText(this@ManageRequestsActivity, "Booking Finalized Successfully!", Toast.LENGTH_SHORT).show()
                    }

                    b.btnOwnerMarkDone.setOnClickListener {
                        data.isCompleted = true
                        
                        // Update machine's last work date
                        val dateFormat = java.text.SimpleDateFormat("MMM dd, yyyy HH:mm", java.util.Locale.getDefault())
                        val now = java.util.Calendar.getInstance().time
                        val workInfo = dateFormat.format(now)
                        
                        com.nammayantra.share.data.DataRepository.getEquipment().find { it.id == data.equipmentId }?.let { eq ->
                            eq.lastWork = workInfo
                        }

                        notifyItemChanged(adapterPosition)
                    }
                } else {
                    b.tvStatusLabel.visibility = View.VISIBLE
                    b.tvStatusLabel.text = "DECLINED"
                    b.tvStatusLabel.setTextColor(getColor(R.color.status_declined))
                }
            }
        }
    }
}
