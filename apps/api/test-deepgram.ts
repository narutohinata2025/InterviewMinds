// apps/api/test-deepgram.ts
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // .env file padhega

async function testDeepgram() {
  console.log("🚀 Testing Deepgram API...");
  console.log(
    "🔑 API Key used:",
    process.env.DEEPGRAM_API_KEY ? "Found" : "MISSING",
  );

  try {
    const response = await axios.post(
      "https://api.deepgram.com/v1/speak?model=aura-asteria-en",
      { text: "Hello, this is a test." },
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
        timeout: 10000, // 10 second ka timeout taaki latke nahi
      },
    );

    console.log("✅ SUCCESS! Audio generated.");
    console.log("📊 Size:", response.data.length, "bytes");
  } catch (error: unknown) {
    console.error("❌ FAILED!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    if (err.response) {
      console.error("👉 Status:", err.response.status);
      console.error("👉 Reason:", err.response.data.toString());
    } else {
      console.error("👉 Error:", err.message);
    }
  }
}

testDeepgram();
