package com.nammayantra.share.model

import java.io.Serializable

data class Equipment(
    val id: String,
    val name: String,
    val type: String,
    val owner: String,
    val ownerPhone: String? = null,
    val ownerAddress: String? = null,
    val hourlyRate: Int,
    val dailyRate: Int = 4000,
    var healthCondition: String,
    var lastWork: String? = null,
    val isAvailable: Boolean = true,
    val distanceKm: Double = 0.0,
    val imageUrl: String = ""
) : Serializable

data class BookingRequest(
    val id: String,
    val equipmentId: String = "",
    val equipmentName: String,
    val ownerName: String,
    val ownerPhone: String = "98765 43210",
    val ownerAddress: String = "Village Center",
    val farmerName: String = "Somanna",
    val farmerPhone: String = "99887 76655",
    val farmerAddress: String = "Farmers Colony",
    val date: String = "May 15, 2026",
    val startTime: String = "08:00",
    val endTime: String = "12:00",
    val duration: Int,
    val totalAmount: Int,
    var status: String = "PENDING", // PENDING, ACCEPTED, DECLINED
    var farmerConfirmed: Boolean = false,
    var paymentMethod: String? = null,
    var ownerFinalized: Boolean = false,
    var isCompleted: Boolean = false,
    var isReviewed: Boolean = false,
    var rating: Float = 0f,
    var comment: String? = null,
    var details: String? = null
) : Serializable
