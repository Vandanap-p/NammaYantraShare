package com.nammayantra.share

import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.nammayantra.share.data.DataRepository
import com.nammayantra.share.databinding.ActivityMyBookingsBinding
import com.nammayantra.share.databinding.ItemMyBookingBinding
import com.nammayantra.share.model.BookingRequest

class MyBookingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMyBookingsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMyBookingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.rvMyBookings.layoutManager = LinearLayoutManager(this)
        binding.rvMyBookings.adapter = BookingAdapter(DataRepository.getMyBookings())
    }

    inner class BookingAdapter(private val bookings: List<BookingRequest>) : RecyclerView.Adapter<BookingAdapter.ViewHolder>() {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val b = ItemMyBookingBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return ViewHolder(b)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.bind(bookings[position])
        }

        override fun getItemCount(): Int = bookings.size

        inner class ViewHolder(val b: ItemMyBookingBinding) : RecyclerView.ViewHolder(b.root) {
            fun bind(data: BookingRequest) {
                b.tvMachineName.text = data.equipmentName
                b.tvOwnerName.text = "Owner: ${data.ownerName} (${data.ownerPhone})"
                b.tvOwnerAddress.text = "Address: ${data.ownerAddress}"
                b.tvBookingDetails.text = "Duration: ${data.duration} hrs | Total: ₹${data.totalAmount}"
                b.tvTimeRange.text = "${data.startTime} to ${data.endTime} | ${data.date}"
                b.tvStatus.text = data.status

                // Reset visibility
                b.llAcceptedActions.visibility = android.view.View.GONE
                b.llBookingSuccess.visibility = android.view.View.GONE
                b.btnMarkDone.visibility = android.view.View.GONE
                b.llReviewSection.visibility = android.view.View.GONE
                b.tvReviewDisplay.visibility = android.view.View.GONE

                if (data.isCompleted) {
                    b.tvStatus.text = "COMPLETED"
                    b.tvStatus.setTextColor(getColor(R.color.status_accepted))
                    if (data.isReviewed) {
                        b.tvReviewDisplay.visibility = android.view.View.VISIBLE
                        b.tvReviewDisplay.text = "Your Review: ${data.rating.toInt()} Stars - ${data.comment}"
                    } else {
                        b.llReviewSection.visibility = android.view.View.VISIBLE
                    }
                } else if (data.ownerFinalized) {
                    b.tvStatus.text = "FINALIZED"
                    b.tvStatus.setTextColor(getColor(R.color.status_accepted))
                    b.llBookingSuccess.visibility = android.view.View.VISIBLE
                    b.btnMarkDone.visibility = android.view.View.VISIBLE
                } else if (data.status == "ACCEPTED") {
                    b.tvStatus.setTextColor(getColor(R.color.status_accepted))
                    b.llAcceptedActions.visibility = android.view.View.VISIBLE
                    
                    if (!data.farmerConfirmed) {
                        b.btnFarmerConfirm.visibility = android.view.View.VISIBLE
                        b.llPaymentOptions.visibility = android.view.View.GONE
                    } else {
                        b.btnFarmerConfirm.visibility = android.view.View.GONE
                        b.llPaymentOptions.visibility = if (data.paymentMethod == null) android.view.View.VISIBLE else android.view.View.GONE
                        
                        if (data.paymentMethod != null) {
                            b.llBookingSuccess.visibility = android.view.View.VISIBLE
                            b.tvOwnerContact.text = "Payment set to ${data.paymentMethod}. Waiting for Finalize."
                        }
                    }
                } else if (data.status == "DECLINED") {
                    b.tvStatus.setTextColor(getColor(R.color.status_declined))
                } else {
                    b.tvStatus.setTextColor(getColor(R.color.agri_earth))
                }

                b.btnCall.setOnClickListener {
                    val intent = android.content.Intent(android.content.Intent.ACTION_DIAL)
                    intent.data = android.net.Uri.parse("tel:${data.ownerPhone}")
                    startActivity(intent)
                }

                b.btnFarmerConfirm.setOnClickListener {
                    data.farmerConfirmed = true
                    notifyItemChanged(adapterPosition)
                }

                b.btnPayOnline.setOnClickListener {
                    val apps = arrayOf("PhonePe", "Paytm", "GPay")
                    val app = apps.random()
                    android.widget.Toast.makeText(this@MyBookingsActivity, "Simulating redirect to $app...", android.widget.Toast.LENGTH_LONG).show()
                    android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                        android.widget.Toast.makeText(this@MyBookingsActivity, "Payment successful via $app!", android.widget.Toast.LENGTH_SHORT).show()
                        data.paymentMethod = "ONLINE (UPI)"
                        notifyItemChanged(adapterPosition)
                    }, 2000)
                }

                b.btnPayAfter.setOnClickListener {
                    data.paymentMethod = "AFTER WORK"
                    notifyItemChanged(adapterPosition)
                }

                b.btnMarkDone.setOnClickListener {
                    data.isCompleted = true
                    notifyItemChanged(adapterPosition)
                }

                b.btnSubmitReview.setOnClickListener {
                    val comment = b.etComment.text.toString()
                    if (comment.isNotEmpty()) {
                        data.rating = b.rbRating.rating
                        data.comment = comment
                        data.isReviewed = true
                        android.widget.Toast.makeText(this@MyBookingsActivity, "Review submitted!", android.widget.Toast.LENGTH_SHORT).show()
                        notifyItemChanged(adapterPosition)
                    }
                }
            }
        }
    }
}
