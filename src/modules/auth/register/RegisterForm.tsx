"use client"
import { useState } from "react"
import type React from "react"

import { useAuth } from "../common/hooks/useAuth"
import { checkEmailAPI } from "../common/services/authService"
import validator from "validator"
import Link from "next/link"
import { useRouter } from "next/navigation"

const RegisterForm = () => {
  const { register, loading, error } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [validationError, setValidationError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [fullName, setFullName] = useState("")
  const [fullNameError, setFullNameError] = useState("")

  // Kiểm tra định dạng email
  const isValidEmailFormat = (email: string): boolean => {
    // Kiểm tra có @ không
    const atIndex = email.indexOf("@")
    if (atIndex === -1) return false

    // Lấy phần sau @
    const domainPart = email.slice(atIndex + 1)

    // Kiểm tra có ít nhất một dấu . sau @ không
    return domainPart.includes(".")
  }

  // Kiểm tra email với API
  const checkEmail = async (email: string) => {
    try {
      const { isValid } = await checkEmailAPI(email)
      if (!isValid) {
        setEmailError("Email đã được sử dụng.")
      } else {
        setEmailError("")
      }
    } catch (error: any) {
      setEmailError("Lỗi kiểm tra email. Vui lòng thử lại.")
      console.error("Lỗi kiểm tra email:", error)
    }
  }

  // Xử lý khi email thay đổi
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    setEmailError("")
  }

  // Xử lý khi người dùng rời khỏi input email
  const handleEmailBlur = () => {
    if (!email) return

    if (!isValidEmailFormat(email)) {
      setEmailError("Email không hợp lệ")
      return
    }

    // Nếu email hợp lệ, kiểm tra với API
    checkEmail(email)
  }

  const handleFullNameBlur = () => {
    if (!fullName) return
    setFullNameError("")
  }

  const validateForm = (): boolean => {
    // Kiểm tra email rỗng
    if (!email) {
      setValidationError("Vui lòng nhập email.")
      return false
    }

    // Kiểm tra định dạng email
    if (!isValidEmailFormat(email)) {
      setValidationError("Email không hợp lệ")
      return false
    }

    // Kiểm tra nếu có lỗi email từ API
    if (emailError) {
      setValidationError(emailError)
      return false
    }

    // Kiểm tra độ dài mật khẩu
    if (!validator.isLength(password, { min: 6 })) {
      setValidationError("Mật khẩu phải có ít nhất 6 ký tự.")
      return false
    }

    // Kiểm tra mật khẩu xác nhận
    if (!validator.equals(password, confirmPassword)) {
      setValidationError("Mật khẩu xác nhận không khớp.")
      return false
    }

    setValidationError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      const result = await register(email, password, fullName)
      // if (result) {
      //   // Lưu email vào localStorage
      //   localStorage.setItem("verificationEmail", email)
      //   // Đảm bảo chuyển hướng đúng đến trang xác thực
      //   router.push(
      //     {
      //       pathname: "/verify-email",
      //       // Thêm replace: true để tránh quay lại trang đăng ký
      //     },
      //     undefined,
      //     { shallow: false, replace: true },
      //   )
      // }
      router.push("/login")
    } catch (error) {
      console.error("Registration error:", error)
    }
  }

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFullName = e.target.value
    setFullName(newFullName)
    setFullNameError("")
  }


  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="flex justify-center items-center pt-6">
          <img
            src="/logo-yaviet/LOGO YAVIET 2.png"
            alt="logo"
            className="w-52 h-16"
          />
        </div>
        <div className="p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Đăng ký tài khoản</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Nhập họ tên của bạn"
                value={fullName}
                onChange={handleFullNameChange}
                onBlur={handleFullNameBlur}
                className={`w-full p-3 border ${fullNameError ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                required
              />
              {fullNameError && <p className="mt-1 text-sm text-red-500">{fullNameError}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                className={`w-full p-3 border ${emailError ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                required
              />
              {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 font-semibold mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-2">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Xác nhận mật khẩu của bạn"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {validationError && <p className="text-center text-red-500">{validationError}</p>}

            <button
              type="submit"
              disabled={loading || !!emailError}
              className={`w-full py-3 rounded-lg text-white font-medium text-lg ${loading || !!emailError
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 transition-colors"
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang đăng ký...
                </span>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-green-600 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
