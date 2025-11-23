// trigger redeploy – v1.0
import admin from "firebase-admin";

// 读取环境变量中的 Service-Account JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN);

// 只初始化一次
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// 读取最新留言（按 time 降序）
export default async function handler(req, res) {
  try {
    const snapshot = await db
      .collection("messages")
      .orderBy("time", "desc")
      .get();

    const results = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        text: d.text,
        time: d.time
          ? d.time
              .toDate()
              .toLocaleString("zh-CN", {
                timeZone: "Asia/Shanghai",
                hour12: false,
              })
          : "",
      };
    });

    res.status(200).json(results);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
}
