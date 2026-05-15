package com.nammayantra.share

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.nammayantra.share.databinding.ActivityRegisterBinding

class RegisterActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnRegister.setOnClickListener {
            val name = binding.etRegName.text.toString()
            val phone = binding.etRegPhone.text.toString()
            val address = binding.etRegAddress.text.toString()
            val password = binding.etRegPassword.text.toString()
            val role = if (binding.rbOwner.isChecked) "OWNER" else "FARMER"

            if (name.isNotEmpty() && phone.isNotEmpty() && address.isNotEmpty() && password.isNotEmpty()) {
                val success = com.nammayantra.share.data.DataRepository.registerUser(
                    com.nammayantra.share.data.DataRepository.UserAccount(name, phone, address, role)
                )
                
                if (success) {
                    Toast.makeText(this, "Welcome, $name! Registered as $role. Please login.", Toast.LENGTH_LONG).show()
                    startActivity(Intent(this, LoginActivity::class.java))
                    finish()
                } else {
                    Toast.makeText(this, "User with this phone already exists", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            }
        }

        binding.tvGoToLogin.setOnClickListener {
            finish()
        }
    }
}
