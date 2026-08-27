export async function sendOtp(phone) {
  // MSG91/Twilio integration will be implemented here.
  return { success: true, phone };
}

export async function verifyProviderOtp(phone, otp) {
  return Boolean(phone && otp);
}
