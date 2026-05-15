package com.nammayantra.share

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.nammayantra.share.databinding.ActivityLoginBinding

class LoginActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener {
            val name = binding.etLoginName.text.toString()
            val password = binding.etLoginPassword.text.toString()

            if (name.isNotEmpty() && password.isNotEmpty()) {
                val user = com.nammayantra.share.data.DataRepository.login(name)
                if (user != null) {
                    val prefs = getSharedPreferences("NAMMA_PREFS", MODE_PRIVATE)
                    prefs.edit().putString("ROLE", user.role)
                        .putString("NAME", user.name)
                        .apply()
                        
                    startActivity(Intent(this, MainActivity::class.java))
                    finish()
                } else {
                    Toast.makeText(this, "User not found. Please register.", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(this, "Invalid Name or Password", Toast.LENGTH_SHORT).show()
            }
        }

        binding.tvGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }
}
