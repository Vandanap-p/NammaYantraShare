package com.nammayantra.share.data

import com.nammayantra.share.model.Equipment
import com.nammayantra.share.model.BookingRequest

object DataRepository {
    data class UserAccount(val name: String, val phone: String, val address: String, val role: String)
    private val users = mutableListOf<UserAccount>()
    var loggedInUser: UserAccount? = null

    fun registerUser(user: UserAccount): Boolean {
        if (users.any { it.phone == user.phone }) return false
        users.add(user)
        return true
    }

    fun login(name: String): UserAccount? {
        val user = users.find { it.name.equals(name, ignoreCase = true) }
        loggedInUser = user
        return user
    }

    private val equipmentList = mutableListOf<Equipment>().apply {
        add(Equipment(id = "1", name = "Mahindra 575 DI", type = "Tractor", owner = "Raju Gowda", hourlyRate = 500, dailyRate = 4000, healthCondition = "Excellent", lastWork = "May 10, 2026", isAvailable = true, distanceKm = 2.5, imageUrl = ""))
        add(Equipment(id = "2", name = "John Deere 5050D", type = "Tractor", owner = "Suresh Kumar", hourlyRate = 600, dailyRate = 4500, healthCondition = "Good", lastWork = "May 08, 2026", isAvailable = true, distanceKm = 4.1, imageUrl = ""))
        add(Equipment(id = "3", name = "Kubota Harvester", type = "Harvester", owner = "Manjunath", hourlyRate = 1500, dailyRate = 10000, healthCondition = "Excellent", lastWork = "May 12, 2026", isAvailable = true, distanceKm = 1.2, imageUrl = ""))
    }
    private val myBookings = mutableListOf<BookingRequest>().apply {
        // Sample accepted booking for testing "accepted" flow
        add(BookingRequest(
            id = "r101", 
            equipmentName = "Kubota Harvester", 
            ownerName = "Manjunath",
            duration = 4, 
            totalAmount = 6000, 
            status = "ACCEPTED",
            farmerName = "Somanna",
            startTime = "09:00",
            endTime = "13:00"
        ))
    }

    fun getEquipment() = equipmentList
    
    fun addEquipment(item: Equipment) {
        equipmentList.add(0, item)
    }

    fun getMyBookings() = myBookings
    fun getAllBookings() = myBookings

    fun addBooking(booking: BookingRequest) {
        myBookings.add(0, booking)
    }
    
    fun clearData() {
        equipmentList.clear()
        myBookings.clear()
        loggedInUser = null
    }
}
