import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

// 設定發信的信箱與應用程式密碼
// 在正式環境中，建議使用 Firebase Secret Manager (defineSecret) 或設定環境變數
const EMAIL_USER = process.env.EMAIL_USER || "your-email@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "your-app-password";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const sendClassReminders = onSchedule(
  {
    schedule: "0 20 * * *", // 每天晚上 20:00 執行
    timeZone: "Asia/Taipei", // 設定為台灣時間
  },
  async (event) => {
    const db = admin.firestore();
    const now = new Date();
    
    // 計算明天的日期
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 考慮時區問題，手動組合 YYYY-MM-DD 字串 (Asia/Taipei)
    const formatter = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    // formatter.format 輸出格式如 "2024/05/20"，需轉換成 "2024-05-20"
    const tomorrowStr = formatter.format(tomorrow).replace(/\//g, '-');
    
    console.log(`Checking sessions for tomorrow: ${tomorrowStr}`);

    try {
      // 1. 找出明天的所有課程
      const sessionsSnapshot = await db
        .collection("schedules")
        .where("date", "==", tomorrowStr)
        .get();

      if (sessionsSnapshot.empty) {
        console.log("No sessions scheduled for tomorrow.");
        return;
      }

      // 2. 針對每堂課找出成功預約且尚未發送過提醒的學生 (status === 'confirmed')
      for (const sessionDoc of sessionsSnapshot.docs) {
        const session = sessionDoc.data();
        
        // 若課程已被標記為已完成，則跳過
        if (session.status === 'completed') {
           continue;
        }

        const bookingsSnapshot = await db
          .collection("bookings")
          .where("sessionId", "==", sessionDoc.id)
          .where("status", "==", "confirmed")
          .get();

        for (const bookingDoc of bookingsSnapshot.docs) {
          const booking = bookingDoc.data();
          
          // 檢查是否已經寄送過 (避免重複發送)
          if (booking.reminderSent) {
            continue;
          }
          
          if (!booking.email) {
            console.log(`No email found for booking ${bookingDoc.id}`);
            continue;
          }

          const mailOptions = {
            from: `"桌球預約系統" <${EMAIL_USER}>`,
            to: booking.email,
            subject: "【桌球課程提醒】您明天有預約課程",
            text: `您好，${booking.studentName}：\n\n提醒您，您預約的桌球課程將於明天開始。\n\n📅 上課日期：${session.date}\n\n🕒 上課時間：${session.startTime} - ${session.endTime}\n\n📍 上課地點：${session.location || '待通知'}\n\n請準時到場，如有任何問題請聯絡教練。\n\n謝謝，祝您上課愉快！`,
          };

          try {
            await transporter.sendMail(mailOptions);
            console.log(`Reminder email sent successfully to ${booking.email}`);
            
            // 標記為已發送，避免重複
            await bookingDoc.ref.update({
              reminderSent: true,
              reminderSentAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch (emailError) {
            console.error(`Failed to send email to ${booking.email}:`, emailError);
          }
        }
      }
    } catch (error) {
      console.error("Error running sendClassReminders function:", error);
    }
  }
);

export const sendWaitlistOfferedEmail = onDocumentUpdated("bookings/{bookingId}", async (event) => {
  const newValue = event.data?.after.data();
  const previousValue = event.data?.before.data();

  if (!newValue || !previousValue) return;

  if (previousValue.status === "waitlist" && newValue.status === "offered") {
    if (!newValue.email) {
      console.log(`No email found for waitlist booking ${event.params.bookingId}`);
      return;
    }

    try {
      const db = admin.firestore();
      const sessionDoc = await db.collection("schedules").doc(newValue.sessionId).get();
      if (!sessionDoc.exists) return;
      const session = sessionDoc.data();
      if (!session) return;

      const mailOptions = {
        from: `"桌球預約系統" <${EMAIL_USER}>`,
        to: newValue.email,
        subject: "【桌球課程候補成功通知】您已成功候補上課程",
        text: `您好，${newValue.studentName}：\n\n好消息！您候補的桌球課程已有空位釋出，您已順利候補成功。\n\n📅 上課日期：${session.date}\n\n🕒 上課時間：${session.startTime} - ${session.endTime}\n\n請盡快登入系統，點選「確認預約並上傳匯款」並提供匯款截圖或帳戶後五碼以保留您的名額。\n\n謝謝！`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Waitlist offered email sent successfully to ${newValue.email}`);
    } catch (error) {
      console.error(`Failed to send waitlist offered email to ${newValue.email}:`, error);
    }
  }
});
