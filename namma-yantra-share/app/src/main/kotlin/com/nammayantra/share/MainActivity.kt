package com.nammayantra.share

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.nammayantra.share.adapter.EquipmentAdapter
import com.nammayantra.share.databinding.ActivityMainBinding
import com.nammayantra.share.model.Equipment

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var adapter: EquipmentAdapter
    private lateinit var reviewAdapter: ReviewAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupReviewsRecyclerView()
        setupNavigation()
        setupSearch()
        applyRoleRestrictions()
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                refreshList()
            }
            override fun afterTextChanged(s: android.text.Editable?) {}
        })
    }

    private fun applyRoleRestrictions() {
        val prefs = getSharedPreferences("NAMMA_PREFS", MODE_PRIVATE)
        val role = prefs.getString("ROLE", "FARMER")

        if (role == "OWNER") {
            binding.fabAddMachine.visibility = android.view.View.VISIBLE
            binding.btnManageRequests.visibility = android.view.View.VISIBLE
            binding.btnMyBookings.visibility = android.view.View.GONE
        } else {
            binding.fabAddMachine.visibility = android.view.View.GONE
            binding.btnManageRequests.visibility = android.view.View.GONE
            binding.btnMyBookings.visibility = android.view.View.VISIBLE
        }
    }

    override fun onResume() {
        super.onResume()
        refreshList()
    }

    private fun refreshList() {
        val query = binding.etSearch.text.toString().lowercase()
        val allEquipment = com.nammayantra.share.data.DataRepository.getEquipment()
        val filteredList = allEquipment.filter { it.name.lowercase().contains(query) }
        adapter.setItems(filteredList)

        val reviews = com.nammayantra.share.data.DataRepository.getAllBookings().filter { it.isReviewed }
        if (reviews.isNotEmpty()) {
            binding.tvRecentReviews.visibility = android.view.View.VISIBLE
            binding.rvReviews.visibility = android.view.View.VISIBLE
            reviewAdapter.setItems(reviews)
        } else {
            binding.tvRecentReviews.visibility = android.view.View.GONE
            binding.rvReviews.visibility = android.view.View.GONE
        }
    }

    private fun setupReviewsRecyclerView() {
        reviewAdapter = ReviewAdapter()
        binding.rvReviews.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        binding.rvReviews.adapter = reviewAdapter
    }

    private fun setupNavigation() {
        binding.fabAddMachine.setOnClickListener {
            startActivity(android.content.Intent(this, AddMachineActivity::class.java))
        }

        binding.btnManageRequests.setOnClickListener {
            startActivity(android.content.Intent(this, ManageRequestsActivity::class.java))
        }

        binding.btnMyBookings.setOnClickListener {
            startActivity(android.content.Intent(this, MyBookingsActivity::class.java))
        }

        binding.btnLogout.setOnClickListener {
            val builder = androidx.appcompat.app.AlertDialog.Builder(this)
            builder.setTitle("Logout")
            builder.setMessage("Are you sure you want to logout?")
            builder.setPositiveButton("Logout") { _, _ ->
                com.nammayantra.share.data.DataRepository.clearData()
                startActivity(android.content.Intent(this, LoginActivity::class.java))
                finish()
            }
            builder.setNegativeButton("Cancel", null)
            builder.show()
        }
    }

    private fun setupRecyclerView() {
        adapter = EquipmentAdapter()
        binding.rvEquipment.layoutManager = LinearLayoutManager(this)
        binding.rvEquipment.adapter = adapter
    }
}
