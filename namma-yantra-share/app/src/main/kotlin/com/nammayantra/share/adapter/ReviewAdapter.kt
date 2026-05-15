package com.nammayantra.share.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.nammayantra.share.databinding.ItemReviewBinding
import com.nammayantra.share.model.BookingRequest

class ReviewAdapter : RecyclerView.Adapter<ReviewAdapter.ReviewViewHolder>() {

    private val items = mutableListOf<BookingRequest>()

    fun setItems(newItems: List<BookingRequest>) {
        items.clear()
        items.addAll(newItems.filter { it.isReviewed })
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReviewViewHolder {
        val binding = ItemReviewBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ReviewViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ReviewViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount() = items.size

    class ReviewViewHolder(private val binding: ItemReviewBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: BookingRequest) {
            binding.tvFarmerName.text = item.farmerName
            binding.tvReviewDate.text = item.date
            binding.rbRating.rating = item.rating
            binding.tvComment.text = "\"${item.comment}\""
            binding.tvMachineName.text = item.equipmentName
        }
    }
}
