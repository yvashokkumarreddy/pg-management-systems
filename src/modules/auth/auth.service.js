export async function requestOtp(phone) {
  // OTP provider integration will be implemented here.
  return { phone };
}

export async function verifyOtp(phone, otp) {
  // OTP verification and session creation will be implemented here.
  return { phone, otp };
}
